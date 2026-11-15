import random
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
    def __init__(self, room_code: str):
        self.state = GameState(room_code=room_code.upper())

    def add_player(self, player: Player) -> bool:
        if self.state.phase != GamePhase.LOBBY:
            return False
        self.state.players[player.id] = player
        return True

    def remove_player(self, player_id: str):
        if player_id in self.state.players:
            del self.state.players[player_id]

    def assign_roles(
        self,
        num_traitors: int = 2,
        num_detectives: int = 1,
        num_doctors: int = 1,
    ) -> Dict[str, Role]:
        player_ids = list(self.state.players.keys())
        if len(player_ids) < 4:
            raise ValueError("At least 4 players are required to assign roles.")

        shuffled = random.sample(player_ids, len(player_ids))
        assigned: Dict[str, Role] = {}

        # Traitors
        for _ in range(min(num_traitors, len(shuffled))):
            pid = shuffled.pop()
            assigned[pid] = Role.TRAITOR

        # Detective
        if shuffled and num_detectives > 0:
            pid = shuffled.pop()
            assigned[pid] = Role.DETECTIVE

        # Doctor
        if shuffled and num_doctors > 0:
            pid = shuffled.pop()
            assigned[pid] = Role.DOCTOR

        # Remaining are Faithful
        while shuffled:
            pid = shuffled.pop()
            assigned[pid] = Role.FAITHFUL

        for pid, role in assigned.items():
            self.state.players[pid].role = role

        return assigned

    def start_game(self):
        if len(self.state.players) < 4:
            raise ValueError("Need at least 4 players to start the game.")
        self.assign_roles()
        self.state.phase = GamePhase.ROLE_REVEAL
        self.state.round_number = 1
        self.state.timer_seconds = 30

    def advance_to_discussion(self):
        self.state.phase = GamePhase.DISCUSSION
        self.state.timer_seconds = 120

    def advance_to_voting(self):
        self.state.phase = GamePhase.VOTING
        self.state.votes = []
        self.state.timer_seconds = 90

    def cast_vote(self, voter_id: str, target_id: str) -> bool:
        if self.state.phase != GamePhase.VOTING:
            return False
        if voter_id not in self.state.players or target_id not in self.state.players:
            return False

        voter = self.state.players[voter_id]
        target = self.state.players[target_id]

        if voter.status != PlayerStatus.ALIVE or target.status != PlayerStatus.ALIVE:
            return False
        if voter_id == target_id:
            return False

        # Remove existing vote by this voter if any
        self.state.votes = [v for v in self.state.votes if v.voter_id != voter_id]
        self.state.votes.append(
            Vote(
                voter_id=voter_id,
                target_id=target_id,
                round_number=self.state.round_number,
            )
        )
        return True

    def tally_votes(self) -> Tuple[Optional[Player], List[VoteTally]]:
        tallies_map: Dict[str, List[str]] = {}
        for vote in self.state.votes:
            tallies_map.setdefault(vote.target_id, []).append(vote.voter_id)

        total_votes = len(self.state.votes)
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

        if banished_player:
            banished_player.status = PlayerStatus.BANISHED
            banished_player.status_round = f"Banished Round {self.state.round_number}"
            self.state.banished_player_id = banished_player.id

        self.state.phase = GamePhase.VOTING_RESULTS

        # Check win condition immediately after banishment
        outcome = self.check_win_condition()
        if outcome != GameOutcome.ONGOING:
            self.state.outcome = outcome
            self.state.phase = GamePhase.GAME_OVER

        return banished_player, tallies

    def advance_to_night(self):
        if self.state.outcome != GameOutcome.ONGOING:
            self.state.phase = GamePhase.GAME_OVER
            return
        self.state.phase = GamePhase.NIGHT
        self.state.night_actions = []
        self.state.timer_seconds = 30

    def record_night_action(
        self, actor_id: str, action_type: NightActionType, target_id: str
    ) -> bool:
        if self.state.phase != GamePhase.NIGHT:
            return False
        if actor_id not in self.state.players or target_id not in self.state.players:
            return False

        actor = self.state.players[actor_id]
        if actor.status != PlayerStatus.ALIVE:
            return False

        # Validate role action permissions
        if action_type == NightActionType.KILL and actor.role != Role.TRAITOR:
            return False
        if action_type == NightActionType.SAVE and actor.role != Role.DOCTOR:
            return False
        if action_type == NightActionType.INVESTIGATE and actor.role != Role.DETECTIVE:
            return False

        self.state.night_actions = [
            a for a in self.state.night_actions if a.actor_id != actor_id
        ]
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
        self.state.round_number += 1

        # Check win condition after night
        outcome = self.check_win_condition()
        if outcome != GameOutcome.ONGOING:
            self.state.outcome = outcome
            self.state.phase = GamePhase.GAME_OVER

        return murdered_player

    def check_win_condition(self) -> GameOutcome:
        alive_players = [
            p for p in self.state.players.values() if p.status == PlayerStatus.ALIVE
        ]
        alive_traitors = [p for p in alive_players if p.role == Role.TRAITOR]
        alive_faithful = [p for p in alive_players if p.role != Role.TRAITOR]

        if len(alive_traitors) == 0:
            return GameOutcome.FAITHFUL_VICTORY
        if len(alive_traitors) >= len(alive_faithful):
            return GameOutcome.TRAITOR_VICTORY
        return GameOutcome.ONGOING

    def get_public_state(self, viewer_id: Optional[str] = None) -> dict:
        """
        STRICT ZERO ROLE LEAKAGE:
        Returns public game state where player secret roles are ONLY revealed:
        1. To the player themselves (viewer_id == player.id)
        2. If the game is GAME_OVER (Grand Unmasking)
        3. If the player is currently banished at VOTING_RESULTS (Circle of Truth)
        """
        players_public = []
        is_game_over = self.state.phase == GamePhase.GAME_OVER

        for p in self.state.players.values():
            can_see_role = (
                is_game_over
                or (viewer_id and p.id == viewer_id)
                or (
                    self.state.phase == GamePhase.VOTING_RESULTS
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
                    "is_alive": p.status == PlayerStatus.ALIVE,
                    "role": p.role.value if can_see_role else "Unknown",
                }
            )

        return {
            "room_code": self.state.room_code,
            "phase": self.state.phase,
            "round_number": self.state.round_number,
            "timer_seconds": self.state.timer_seconds,
            "outcome": self.state.outcome,
            "players": players_public,
            "banished_player_id": self.state.banished_player_id,
            "murdered_player_id": self.state.murdered_player_id,
        }

