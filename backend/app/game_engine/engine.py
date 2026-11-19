import random
import time
from typing import Dict, List, Optional, Tuple
from app.game_engine.models import (
    GameState,
    GamePhase,
    GameOutcome,
    Player,
    PlayerStatus,
    Role,
    Vote,
    VoteTally,
    NightAction,
    NightActionType,
    ChatMessage,
)


class GameEngine:
    def __init__(
        self,
        room_code: str,
        room_name: str = "Council Chamber",
        host_id: str = "",
        capacity: int = 8,
        is_private: bool = False,
        night_duration: int = 30,
        discussion_duration: int = 120,
        voting_duration: int = 60,
    ):
        self.state = GameState(
            room_code=room_code.upper(),
            room_name=room_name,
            host_id=host_id,
            capacity=capacity,
            is_private=is_private,
            night_duration=night_duration,
            discussion_duration=discussion_duration,
            voting_duration=voting_duration,
        )

    def add_player(self, player: Player) -> bool:
        if self.state.phase != GamePhase.LOBBY:
            return False
        if len(self.state.players) >= self.state.capacity:
            return False

        # Assign slot index
        player.slot_index = len(self.state.players)
        self.state.players[player.id] = player
        if not self.state.host_id or player.is_host:
            self.state.host_id = player.id
            player.is_host = True

        return True

    def remove_player(self, player_id: str):
        if player_id in self.state.players:
            was_host = self.state.players[player_id].is_host
            del self.state.players[player_id]
            # Reassign host if host left and game is still in lobby
            if was_host and self.state.players and self.state.phase == GamePhase.LOBBY:
                new_host_id = next(iter(self.state.players))
                self.state.players[new_host_id].is_host = True
                self.state.host_id = new_host_id

    def set_player_connection(self, player_id: str, is_connected: bool):
        if player_id in self.state.players:
            self.state.players[player_id].is_connected = is_connected
            if (not is_connected and self.state.players[player_id].is_host
                    and self.state.phase == GamePhase.LOBBY):
                candidates = [p for p in self.state.players.values()
                              if p.id != player_id and p.is_connected]
                if candidates:
                    next_host = min(candidates, key=lambda p: p.slot_index)
                    self.state.players[player_id].is_host = False
                    next_host.is_host = True
                    self.state.host_id = next_host.id

    def toggle_ready(self, player_id: str) -> bool:
        if player_id in self.state.players:
            p = self.state.players[player_id]
            p.is_ready = not p.is_ready
            return p.is_ready
        return False

    def assign_roles(
        self,
        num_traitors: Optional[int] = None,
        num_detectives: Optional[int] = None,
        num_doctors: Optional[int] = None,
    ) -> Dict[str, Role]:
        player_ids = list(self.state.players.keys())
        total = len(player_ids)
        if total < 4:
            raise ValueError("At least 4 players are required to assign roles.")

        shuffled = random.sample(player_ids, total)
        assigned: Dict[str, Role] = {}

        # Master rule distribution
        if num_traitors is None:
            num_traitors = 2 if total >= 6 else 1
        if num_detectives is None:
            num_detectives = 1
        if num_doctors is None:
            num_doctors = 1

        for _ in range(num_traitors):
            if shuffled:
                assigned[shuffled.pop()] = Role.TRAITOR

        if shuffled and num_detectives > 0:
            assigned[shuffled.pop()] = Role.DETECTIVE

        if shuffled and num_doctors > 0:
            assigned[shuffled.pop()] = Role.DOCTOR

        while shuffled:
            assigned[shuffled.pop()] = Role.FAITHFUL

        for pid, role in assigned.items():
            self.state.players[pid].role = role

        return assigned

    def start_game(self):
        if len(self.state.players) < 4:
            raise ValueError("Need at least 4 players to start the game.")
        if any(not player.is_ready for player in self.state.players.values()):
            raise ValueError("All players must be ready before the game starts.")
        if self.state.phase != GamePhase.LOBBY:
            raise ValueError("This game has already started.")
        self.assign_roles()
        self.state.status = "PLAYING"
        self.state.phase = GamePhase.ROLE_REVEAL
        self.state.round_number = 1

        now = time.time()
        self.state.phase_started_at = now
        self.state.phase_ends_at = now + self.state.role_reveal_duration
        self.state.timer_seconds = self.state.role_reveal_duration

    def advance_to_night(self):
        if self.state.outcome != GameOutcome.ONGOING:
            self.state.phase = GamePhase.GAME_OVER
            self.state.status = "FINISHED"
            return

        self.state.phase = GamePhase.NIGHT
        self.state.night_actions = []

        now = time.time()
        self.state.phase_started_at = now
        self.state.phase_ends_at = now + self.state.night_duration
        self.state.timer_seconds = self.state.night_duration

    def record_night_action(
        self, actor_id: str, action_type: NightActionType, target_id: str
    ) -> bool:
        if self.state.phase != GamePhase.NIGHT:
            return False
        if actor_id not in self.state.players or target_id not in self.state.players:
            return False

        actor = self.state.players[actor_id]
        target = self.state.players[target_id]
        if actor.status != PlayerStatus.ALIVE:
            return False
        if target.status != PlayerStatus.ALIVE or actor_id == target_id:
            return False
        if any(a.actor_id == actor_id and a.round_number == self.state.round_number
               for a in self.state.night_actions):
            return False

        # Validate role action permissions
        if action_type == NightActionType.KILL and actor.role != Role.TRAITOR:
            return False
        if action_type == NightActionType.SAVE and actor.role != Role.DOCTOR:
            return False
        if action_type == NightActionType.INVESTIGATE and actor.role != Role.DETECTIVE:
            return False

        self.state.night_actions.append(
            NightAction(
                actor_id=actor_id,
                action_type=action_type,
                target_id=target_id,
                round_number=self.state.round_number,
            )
        )
        return True

    def resolve_night(self) -> Optional[Player]:
        kill_target_id: Optional[str] = None
        save_target_id: Optional[str] = None

        for action in self.state.night_actions:
            if action.action_type == NightActionType.KILL:
                kill_target_id = action.target_id
            elif action.action_type == NightActionType.SAVE:
                save_target_id = action.target_id

        murdered_player: Optional[Player] = None

        if kill_target_id and kill_target_id != save_target_id:
            target = self.state.players.get(kill_target_id)
            if target and target.status == PlayerStatus.ALIVE:
                target.status = PlayerStatus.MURDERED
                target.status_round = f"Murdered Night {self.state.round_number}"
                self.state.murdered_player_id = target.id
                murdered_player = target
        else:
            self.state.murdered_player_id = None

        self.state.phase = GamePhase.MORNING

        now = time.time()
        self.state.phase_started_at = now
        self.state.phase_ends_at = now + self.state.morning_duration
        self.state.timer_seconds = self.state.morning_duration

        # Check win condition after night
        outcome = self.check_win_condition()
        if outcome != GameOutcome.ONGOING:
            self.state.outcome = outcome
            self.state.phase = GamePhase.GAME_OVER
            self.state.status = "FINISHED"

        return murdered_player

    def advance_to_discussion(self):
        if self.state.outcome != GameOutcome.ONGOING:
            self.state.phase = GamePhase.GAME_OVER
            self.state.status = "FINISHED"
            return

        self.state.phase = GamePhase.DISCUSSION
        now = time.time()
        self.state.phase_started_at = now
        self.state.phase_ends_at = now + self.state.discussion_duration
        self.state.timer_seconds = self.state.discussion_duration

    def advance_to_voting(self):
        if self.state.outcome != GameOutcome.ONGOING:
            self.state.phase = GamePhase.GAME_OVER
            self.state.status = "FINISHED"
            return

        self.state.phase = GamePhase.VOTING
        self.state.votes = []
        self.state.vote_tally = []

        now = time.time()
        self.state.phase_started_at = now
        self.state.phase_ends_at = now + self.state.voting_duration
        self.state.timer_seconds = self.state.voting_duration

    def cast_vote(self, voter_id: str, target_id: str) -> bool:
        if self.state.phase != GamePhase.VOTING:
            return False
        if self.state.phase_ends_at <= time.time():
            return False
        if voter_id not in self.state.players or target_id not in self.state.players:
            return False

        voter = self.state.players[voter_id]
        target = self.state.players[target_id]

        if voter.status != PlayerStatus.ALIVE or target.status != PlayerStatus.ALIVE:
            return False
        if voter_id == target_id:
            return False
        if any(v.voter_id == voter_id and v.round_number == self.state.round_number
               for v in self.state.votes):
            return False

        self.state.votes.append(
            Vote(
                voter_id=voter_id,
                target_id=target_id,
                round_number=self.state.round_number,
            )
        )
        return True

    def are_all_votes_in(self) -> bool:
        alive_players = [
            p.id for p in self.state.players.values() if p.status == PlayerStatus.ALIVE
        ]
        voters = {v.voter_id for v in self.state.votes}
        return len(alive_players) > 0 and voters.issuperset(alive_players)

    def tally_votes(self) -> Tuple[Optional[Player], List[VoteTally]]:
        tallies_map: Dict[str, List[str]] = {}
        alive_ids = {p.id for p in self.state.players.values() if p.status == PlayerStatus.ALIVE}
        valid_votes = [v for v in self.state.votes
                       if v.round_number == self.state.round_number
                       and v.voter_id in alive_ids and v.target_id in alive_ids]
        for vote in valid_votes:
            tallies_map.setdefault(vote.target_id, []).append(vote.voter_id)

        total_votes = len(valid_votes)
        tallies: List[VoteTally] = []

        banished_player: Optional[Player] = None
        max_votes = -1

        for target_id, voter_ids in tallies_map.items():
            target_player = self.state.players.get(target_id)
            if not target_player:
                continue
            votes_count = len(voter_ids)
            pct = (votes_count / total_votes * 100) if total_votes > 0 else 0.0
            tallies.append(
                VoteTally(
                    target_id=target_id,
                    target_name=target_player.name,
                    votes_count=votes_count,
                    percentage=round(pct, 1),
                    voter_ids=voter_ids,
                )
            )
            if votes_count > max_votes:
                max_votes = votes_count
                banished_player = target_player

        tallies.sort(key=lambda t: t.votes_count, reverse=True)
        self.state.vote_tally = tallies

        # Check for tie: if top 2 have equal votes, no banishment
        if total_votes == 0 or (len(tallies) > 1 and tallies[0].votes_count == tallies[1].votes_count):
            banished_player = None
            self.state.banished_player_id = None
        elif banished_player:
            banished_player.status = PlayerStatus.BANISHED
            banished_player.status_round = f"Banished Round {self.state.round_number}"
            self.state.banished_player_id = banished_player.id

        self.state.phase = GamePhase.VOTING_RESULTS

        now = time.time()
        self.state.phase_started_at = now
        self.state.phase_ends_at = now + self.state.voting_results_duration
        self.state.timer_seconds = self.state.voting_results_duration

        # Check win condition and store outcome but keep phase as VOTING_RESULTS
        # so all players see the results screen first before GAME_OVER
        outcome = self.check_win_condition()
        if outcome != GameOutcome.ONGOING:
            self.state.outcome = outcome
            # Stay on VOTING_RESULTS so frontend can display banishment results.
            # The coordinator's advance_from_results will transition to GAME_OVER.

        return banished_player, tallies

    def advance_from_results(self):
        if self.state.outcome != GameOutcome.ONGOING:
            self.state.phase = GamePhase.GAME_OVER
            self.state.status = "FINISHED"
            return

        self.state.round_number += 1
        self.advance_to_night()

    def check_win_condition(self) -> GameOutcome:
        alive_players = [
            p for p in self.state.players.values() if p.status == PlayerStatus.ALIVE
        ]
        alive_traitors = [p for p in alive_players if p.role == Role.TRAITOR]
        if len(alive_players) <= 2:
            return GameOutcome.TRAITOR_VICTORY if alive_traitors else GameOutcome.FAITHFUL_VICTORY
        alive_faithful = [p for p in alive_players if p.role != Role.TRAITOR]

        if len(alive_traitors) == 0:
            return GameOutcome.FAITHFUL_VICTORY
        if len(alive_traitors) >= len(alive_faithful):
            return GameOutcome.TRAITOR_VICTORY
        return GameOutcome.ONGOING

    def add_chat_message(self, message: ChatMessage):
        self.state.chat_history.append(message)
        if len(self.state.chat_history) > 100:
            self.state.chat_history.pop(0)

    def get_remaining_seconds(self) -> int:
        if self.state.phase_ends_at <= 0:
            return 0
        return max(0, int(__import__("math").ceil(self.state.phase_ends_at - time.time())))

    def get_public_state(self, viewer_id: Optional[str] = None) -> dict:
        """
        STRICT ZERO ROLE LEAKAGE:
        Returns public game state where player secret roles are ONLY revealed:
        1. To the player themselves (viewer_id == player.id)
        2. If the game is GAME_OVER (Grand Unmasking)
        3. If the player was banished (Circle of Truth)
        """
        players_public = []
        is_game_over = self.state.phase == GamePhase.GAME_OVER

        for p in self.state.players.values():
            can_see_role = (
                is_game_over
                or (viewer_id and p.id == viewer_id)
                or (
                    self.state.phase in (GamePhase.VOTING_RESULTS, GamePhase.GAME_OVER)
                    and p.id == self.state.banished_player_id
                )
            )

            players_public.append(
                {
                    "id": p.id,
                    "name": p.name,
                    "avatar_url": p.avatar_url,
                    "status": p.status,
                    "status_round": p.status_round,
                    "is_host": p.is_host,
                    "is_ready": p.is_ready,
                    "is_connected": p.is_connected,
                    "is_ai": p.is_ai,
                    "is_alive": p.status == PlayerStatus.ALIVE,
                    "slot_index": p.slot_index,
                    "role": p.role.value if can_see_role else "Unknown",
                }
            )

        # Get viewer's own role specifically if requested
        viewer_role = "Unknown"
        if viewer_id and viewer_id in self.state.players:
            viewer_role = self.state.players[viewer_id].role.value

        return {
            "room_code": self.state.room_code,
            "room_name": self.state.room_name,
            "host_id": self.state.host_id,
            "status": self.state.status,
            "phase": self.state.phase.value,
            "round_number": self.state.round_number,
            "capacity": self.state.capacity,
            "is_private": self.state.is_private,
            "phase_started_at": self.state.phase_started_at,
            "phase_ends_at": self.state.phase_ends_at,
            "timer_seconds": self.get_remaining_seconds(),
            "outcome": self.state.outcome.value,
            "players": players_public,
            "viewer_role": viewer_role,
            "banished_player_id": self.state.banished_player_id,
            "murdered_player_id": self.state.murdered_player_id,
            "architect_announcement": self.state.architect_announcement,
            "total_votes_cast": len(self.state.votes),
            "has_voted": bool(viewer_id and any(
                vote.voter_id == viewer_id and vote.round_number == self.state.round_number
                for vote in self.state.votes
            )),
            "vote_tally": ([{"target_id": tally.target_id,
                             "target_name": tally.target_name,
                             "votes_count": tally.votes_count,
                             "percentage": tally.percentage}
                            for tally in self.state.vote_tally]
                           if self.state.phase in (GamePhase.VOTING_RESULTS, GamePhase.GAME_OVER)
                           else []),
        }
