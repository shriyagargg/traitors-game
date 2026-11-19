import asyncio
import logging
import time
import random
from typing import Dict, Optional

from app.game_engine.engine import GameEngine
from app.game_engine.models import GamePhase, GameOutcome, PlayerStatus, Role, NightActionType, ChatMessage
from app.communication.manager import manager
from app.ai_engine.agents.architect import architect_agent
from app.database.session import AsyncSessionLocal
from app.database.repository import save_game_to_db, load_game_from_db, load_active_games_from_db, record_game_stats

logger = logging.getLogger(__name__)


class GameCoordinator:
    def __init__(self):
        self.active_rooms: Dict[str, GameEngine] = {}
        self.running: bool = False
        self._task: Optional[asyncio.Task] = None
        self._phase_locks: Dict[str, asyncio.Lock] = {}
        self._load_locks: Dict[str, asyncio.Lock] = {}

    async def get_room(self, room_code: str) -> Optional[GameEngine]:
        room_code = room_code.upper()
        if room_code in self.active_rooms:
            return self.active_rooms[room_code]

        lock = self._load_locks.setdefault(room_code, asyncio.Lock())
        async with lock:
            if room_code in self.active_rooms:
                return self.active_rooms[room_code]

            # Try to load from database exactly once after restart.
            try:
                async with AsyncSessionLocal() as session:
                    engine = await load_game_from_db(session, room_code)
                    if engine:
                        self.active_rooms[room_code] = engine
                        return engine
            except Exception as e:
                logger.error(f"Error loading room {room_code} from DB: {e}")

        return None

    def get_or_create_room(
        self,
        room_code: str,
        room_name: str = "Council Chamber",
        host_id: str = "",
        capacity: int = 8,
        is_private: bool = False,
        night_duration: int = 30,
        discussion_duration: int = 120,
        voting_duration: int = 60,
    ) -> GameEngine:
        room_code = room_code.upper()
        if room_code not in self.active_rooms:
            self.active_rooms[room_code] = GameEngine(
                room_code=room_code,
                room_name=room_name,
                host_id=host_id,
                capacity=capacity,
                is_private=is_private,
                night_duration=night_duration,
                discussion_duration=discussion_duration,
                voting_duration=voting_duration,
            )
        return self.active_rooms[room_code]

    async def persist_room(self, engine: GameEngine):
        async with AsyncSessionLocal() as session:
            await save_game_to_db(session, engine)

    async def load_active_rooms(self):
        async with AsyncSessionLocal() as session:
            engines = await load_active_games_from_db(session)
        self.active_rooms.update({engine.state.room_code: engine for engine in engines if engine})

    def _simulate_test_player_actions(self, engine: GameEngine):
        alive = [player for player in engine.state.players.values() if player.status == PlayerStatus.ALIVE]
        if engine.state.phase == GamePhase.NIGHT:
            for bot in (p for p in alive if p.is_ai):
                if any(action.actor_id == bot.id and action.round_number == engine.state.round_number for action in engine.state.night_actions):
                    continue
                possible = [target for target in alive if target.id != bot.id]
                if not possible:
                    continue
                if bot.role == Role.TRAITOR:
                    targets = [p for p in possible if p.role != Role.TRAITOR] or possible
                    target = random.choice(targets)
                    action = NightActionType.KILL
                elif bot.role == Role.DOCTOR:
                    target = random.choice(possible)
                    action = NightActionType.SAVE
                elif bot.role == Role.DETECTIVE:
                    target = random.choice(possible)
                    action = NightActionType.INVESTIGATE
                else:
                    continue
                engine.record_night_action(bot.id, action, target.id)
        elif engine.state.phase == GamePhase.VOTING:
            for bot in (p for p in alive if p.is_ai):
                if any(vote.voter_id == bot.id and vote.round_number == engine.state.round_number for vote in engine.state.votes):
                    continue
                targets = [p for p in alive if p.id != bot.id]
                if targets:
                    # Suspicion is role-informed only for bot strategy; the public result still
                    # comes from normal cast_vote validation and tally rules.
                    selected = random.choice(targets)
                    engine.cast_vote(bot.id, selected.id)

    async def _emit_test_player_discussion(self, engine: GameEngine):
        lines = [
            "I noticed the accusations shifted very quickly. I would look at who changed their story.",
            "We should compare what people said before the night and after it.",
            "I am not convinced the loudest accusation is the most reliable one.",
            "The vote should be based on inconsistencies, not just a hunch.",
            "Someone has been steering this conversation away from the useful details.",
        ]
        for bot in (p for p in engine.state.players.values() if p.is_ai and p.status == PlayerStatus.ALIVE):
            message = ChatMessage(
                sender_id=bot.id, sender_name=bot.name, avatar_url=bot.avatar_url,
                content=random.choice(lines), phase="DISCUSSION",
                round_number=engine.state.round_number, is_ai=True,
            )
            engine.add_chat_message(message)
            await manager.broadcast_room(engine.state.room_code, {"type": "DISCUSSION_MESSAGE", "payload": {
                "id": message.id, "senderId": bot.id, "senderName": bot.name,
                "avatarUrl": bot.avatar_url, "text": message.content,
                "content": message.content, "timestamp": time.strftime("%I:%M %p", time.localtime(message.timestamp)),
                "isAI": True,
            }})

    async def advance_phase(self, engine: GameEngine, expected_phase: Optional[GamePhase] = None, allow_early: bool = False) -> str:
        """Server-authoritative progression through all phases."""
        room_code = engine.state.room_code
        lock = self._phase_locks.setdefault(room_code, asyncio.Lock())
        async with lock:
            current_phase = engine.state.phase
            if expected_phase is not None and current_phase != expected_phase:
                return current_phase.value
            if current_phase == GamePhase.LOBBY or current_phase == GamePhase.GAME_OVER:
                return current_phase.value
            if current_phase == GamePhase.VOTING and time.time() < engine.state.phase_ends_at and not engine.are_all_votes_in():
                return current_phase.value
            if allow_early and engine.state.phase_ends_at and time.time() < engine.state.phase_ends_at:
                # Early progression is allowed only when caller met phase completion condition.
                if current_phase not in (
                    GamePhase.VOTING,
                    GamePhase.NIGHT,
                    GamePhase.ROLE_REVEAL,
                    GamePhase.MORNING,
                    GamePhase.DISCUSSION,
                    GamePhase.VOTING_RESULTS,
                ):
                    return current_phase.value
                if current_phase == GamePhase.VOTING and not engine.are_all_votes_in():
                    return current_phase.value
                if current_phase == GamePhase.NIGHT:
                    required_actors = {p.id for p in engine.state.players.values()
                                      if p.status == PlayerStatus.ALIVE and p.role.value in ("Traitor", "Doctor", "Detective")}
                    actors = {a.actor_id for a in engine.state.night_actions}
                    if not required_actors.issubset(actors):
                        return current_phase.value
            # Keep the lock through state transition and persistence so timer,
            # vote completion, and night completion cannot advance twice.
            if current_phase == GamePhase.ROLE_REVEAL:
                engine.advance_to_night()
                self._simulate_test_player_actions(engine)

            elif current_phase == GamePhase.NIGHT:
                murdered = engine.resolve_night()
                alive_count = len([p for p in engine.state.players.values() if p.status == PlayerStatus.ALIVE])
                engine.state.architect_announcement = await architect_agent.generate_morning_announcement(
                    round_number=engine.state.round_number,
                    victim_name=murdered.name if murdered else None,
                    was_saved=(murdered is None),
                    alive_count=alive_count,
                )

            elif current_phase == GamePhase.MORNING:
                engine.advance_to_discussion()
                await self._emit_test_player_discussion(engine)
                alive_names = [p.name for p in engine.state.players.values() if p.status == PlayerStatus.ALIVE]
                engine.state.architect_announcement = await architect_agent.generate_discussion_hint(
                    round_number=engine.state.round_number, player_names=alive_names
                )

            elif current_phase == GamePhase.DISCUSSION:
                engine.advance_to_voting()
                self._simulate_test_player_actions(engine)

            elif current_phase == GamePhase.VOTING:
                banished, tallies = engine.tally_votes()
                if banished:
                    engine.state.architect_announcement = await architect_agent.generate_banishment_proclamation(
                        round_number=engine.state.round_number,
                        banished_name=banished.name,
                        is_traitor=banished.role.value == "Traitor",
                        vote_count=tallies[0].votes_count if tallies else 0,
                        total_votes=len(engine.state.votes),
                    )
                else:
                    engine.state.architect_announcement = "The council stood in deadlock. No player was banished."

            elif current_phase == GamePhase.VOTING_RESULTS:
                engine.advance_from_results()

            await self.persist_room(engine)

            if engine.state.phase == GamePhase.GAME_OVER:
                try:
                    async with AsyncSessionLocal() as session:
                        await record_game_stats(session, engine)
                except Exception as e:
                    logger.error(f"Error recording match history and stats: {e}")

            # Public state intentionally contains no private votes/roles.
            await manager.broadcast_room(room_code, {
                "type": "PHASE_CHANGED",
                "payload": engine.get_public_state(),
            })

            return engine.state.phase.value

    async def _timer_worker(self):
        while self.running:
            try:
                now = time.time()
                for room_code, engine in list(self.active_rooms.items()):
                    state = engine.state
                    if state.status == "PLAYING" and state.phase not in (
                        GamePhase.LOBBY,
                        GamePhase.GAME_OVER,
                    ):
                        if state.phase_ends_at > 0 and now >= state.phase_ends_at:
                            logger.info(
                                f"Timer expired for room {room_code} in phase {state.phase}. Advancing."
                            )
                            await self.advance_phase(engine, expected_phase=state.phase)
            except Exception as e:
                logger.error(f"Error in game coordinator timer loop: {e}")

            await asyncio.sleep(1)

    def start(self):
        if not self.running:
            self.running = True
            self._task = asyncio.create_task(self._timer_worker())
            logger.info("GameCoordinator authoritative timer worker started.")

    async def stop(self):
        self.running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass


coordinator = GameCoordinator()
