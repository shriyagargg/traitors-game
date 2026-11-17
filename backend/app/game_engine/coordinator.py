import asyncio
import logging
import time
from typing import Dict, Optional

from app.game_engine.engine import GameEngine
from app.game_engine.models import GamePhase, GameOutcome, PlayerStatus
from app.communication.manager import manager
from app.ai_engine.agents.architect import architect_agent
from app.database.session import AsyncSessionLocal
from app.database.repository import save_game_to_db, load_game_from_db

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
        try:
            async with AsyncSessionLocal() as session:
                await save_game_to_db(session, engine)
        except Exception as e:
            logger.error(f"Error persisting room {engine.state.room_code}: {e}")

    async def advance_phase(self, engine: GameEngine, expected_phase: Optional[GamePhase] = None, allow_early: bool = False) -> str:
        """Server-authoritative progression through all phases."""
        room_code = engine.state.room_code
        lock = self._phase_locks.setdefault(room_code, asyncio.Lock())
        async with lock:
            current_phase = engine.state.phase
            if expected_phase is not None and current_phase != expected_phase:
                return current_phase.value
            if allow_early and engine.state.phase_ends_at and time.time() < engine.state.phase_ends_at:
                # Early progression is allowed only when the caller has met a
                # completion condition (all votes / required night actions).
                if current_phase not in (GamePhase.VOTING, GamePhase.NIGHT):
                    return current_phase.value
                if current_phase == GamePhase.VOTING and not engine.are_all_votes_in():
                    return current_phase.value
                if current_phase == GamePhase.NIGHT:
                    alive_traitors = {p.id for p in engine.state.players.values()
                                      if p.status == PlayerStatus.ALIVE and p.role.value == "Traitor"}
                    actors = {a.actor_id for a in engine.state.night_actions}
                    if not alive_traitors or not alive_traitors.issubset(actors):
                        return current_phase.value

        if current_phase == GamePhase.ROLE_REVEAL:
            engine.advance_to_night()

        elif current_phase == GamePhase.NIGHT:
            murdered = engine.resolve_night()
            alive_count = len(
                [p for p in engine.state.players.values() if p.status == PlayerStatus.ALIVE]
            )
            announcement = await architect_agent.generate_morning_announcement(
                round_number=engine.state.round_number,
                victim_name=murdered.name if murdered else None,
                was_saved=(murdered is None),
                alive_count=alive_count,
            )
            engine.state.architect_announcement = announcement

        elif current_phase == GamePhase.MORNING:
            engine.advance_to_discussion()
            alive_names = [
                p.name
                for p in engine.state.players.values()
                if p.status == PlayerStatus.ALIVE
            ]
            hint = await architect_agent.generate_discussion_hint(
                round_number=engine.state.round_number, player_names=alive_names
            )
            # Add hint as Architect message
            engine.state.architect_announcement = hint

        elif current_phase == GamePhase.DISCUSSION:
            engine.advance_to_voting()

        elif current_phase == GamePhase.VOTING:
            banished, tallies = engine.tally_votes()
            proclamation = ""
            if banished:
                is_traitor = banished.role.value == "Traitor"
                proclamation = await architect_agent.generate_banishment_proclamation(
                    round_number=engine.state.round_number,
                    banished_name=banished.name,
                    is_traitor=is_traitor,
                    vote_count=tallies[0].votes_count if tallies else 0,
                    total_votes=len(engine.state.votes),
                )
            else:
                proclamation = "The council stood in deadlock. No player was banished."
            engine.state.architect_announcement = proclamation

        elif current_phase == GamePhase.VOTING_RESULTS:
            engine.advance_from_results()

        # Save to DB
        await self.persist_room(engine)

        # Broadcast PHASE_CHANGED to all clients
        await manager.broadcast_room(
            room_code,
            {
                "type": "PHASE_CHANGED",
                "payload": engine.get_public_state(),
            },
        )

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
