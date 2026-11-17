from enum import Enum
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
import time
import uuid


class Role(str, Enum):
    TRAITOR = "Traitor"
    FAITHFUL = "Faithful"
    DOCTOR = "Doctor"
    DETECTIVE = "Detective"


class GamePhase(str, Enum):
    LOBBY = "LOBBY"
    ROLE_REVEAL = "ROLE_REVEAL"
    NIGHT = "NIGHT"
    MORNING = "MORNING"
    DISCUSSION = "DISCUSSION"
    VOTING = "VOTING"
    VOTING_RESULTS = "VOTING_RESULTS"
    GAME_OVER = "GAME_OVER"


class GameOutcome(str, Enum):
    ONGOING = "ONGOING"
    FAITHFUL_VICTORY = "FAITHFUL_VICTORY"
    TRAITOR_VICTORY = "TRAITOR_VICTORY"


class PlayerStatus(str, Enum):
    ALIVE = "ALIVE"
    BANISHED = "BANISHED"
    MURDERED = "MURDERED"


class Player(BaseModel):
    id: str
    name: str
    avatar_url: str = "/images/player_somya.png"
    role: Role = Role.FAITHFUL
    status: PlayerStatus = PlayerStatus.ALIVE
    status_round: Optional[str] = None
    is_host: bool = False
    is_ai: bool = False
    is_ready: bool = True
    is_connected: bool = True
    slot_index: int = 0


class Vote(BaseModel):
    voter_id: str
    target_id: str
    round_number: int


class NightActionType(str, Enum):
    KILL = "KILL"
    SAVE = "SAVE"
    INVESTIGATE = "INVESTIGATE"


class NightAction(BaseModel):
    actor_id: str
    action_type: NightActionType
    target_id: str
    round_number: int


class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    sender_id: str
    sender_name: str
    avatar_url: str = "/images/player_somya.png"
    content: str
    timestamp: float = Field(default_factory=time.time)
    is_architect: bool = False
    is_system: bool = False
    phase: str = "DISCUSSION"
    round_number: int = 1


class VoteTally(BaseModel):
    target_id: str
    target_name: str
    votes_count: int = 0
    percentage: float = 0.0
    voter_ids: List[str] = []


class GameState(BaseModel):
    room_code: str
    room_name: str = "Council Chamber"
    host_id: str = ""
    status: str = "LOBBY"  # LOBBY, PLAYING, FINISHED
    phase: GamePhase = GamePhase.LOBBY
    round_number: int = 1
    capacity: int = 8
    is_private: bool = False

    # Durations in seconds
    role_reveal_duration: int = 20
    night_duration: int = 30
    morning_duration: int = 20
    discussion_duration: int = 120
    voting_duration: int = 60
    voting_results_duration: int = 25

    # Server-Authoritative Timestamps (Epoch seconds)
    phase_started_at: float = 0.0
    phase_ends_at: float = 0.0
    timer_seconds: int = 0

    players: Dict[str, Player] = {}
    votes: List[Vote] = []
    vote_tally: List[VoteTally] = []
    night_actions: List[NightAction] = []
    chat_history: List[ChatMessage] = []
    outcome: GameOutcome = GameOutcome.ONGOING

    banished_player_id: Optional[str] = None
    murdered_player_id: Optional[str] = None
    architect_announcement: Optional[str] = None
