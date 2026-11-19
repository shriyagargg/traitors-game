from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    Float,
    DateTime,
    Text,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.database.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class GameModel(Base):
    __tablename__ = "games"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    room_code = Column(String(16), unique=True, nullable=False, index=True)
    room_name = Column(String(100), nullable=False, default="Council Chamber")
    host_id = Column(String(64), nullable=False)
    status = Column(String(32), nullable=False, default="LOBBY")  # LOBBY, PLAYING, FINISHED
    current_phase = Column(String(32), nullable=False, default="LOBBY")
    current_round = Column(Integer, nullable=False, default=1)
    capacity = Column(Integer, nullable=False, default=8)
    is_private = Column(Boolean, nullable=False, default=False)

    # Durations in seconds
    night_duration = Column(Integer, nullable=False, default=30)
    discussion_duration = Column(Integer, nullable=False, default=120)
    voting_duration = Column(Integer, nullable=False, default=60)

    # Server-Authoritative Timestamps (Epoch seconds)
    phase_started_at = Column(Float, nullable=False, default=0.0)
    phase_ends_at = Column(Float, nullable=False, default=0.0)

    # Resolution state
    banished_player_id = Column(String(64), nullable=True)
    murdered_player_id = Column(String(64), nullable=True)
    architect_announcement = Column(Text, nullable=True)
    outcome = Column(String(32), nullable=False, default="ONGOING")

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    players = relationship("PlayerModel", back_populates="game", cascade="all, delete-orphan")
    votes = relationship("VoteModel", back_populates="game", cascade="all, delete-orphan")
    night_actions = relationship(
        "NightActionModel", back_populates="game", cascade="all, delete-orphan"
    )
    chat_messages = relationship(
        "ChatMessageModel", back_populates="game", cascade="all, delete-orphan"
    )


class PlayerModel(Base):
    __tablename__ = "players"

    id = Column(String(64), primary_key=True)
    game_id = Column(String(36), ForeignKey("games.id", ondelete="CASCADE"), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(64), nullable=False)
    avatar_url = Column(String(255), nullable=False, default="")
    role = Column(String(32), nullable=False, default="Faithful")
    status = Column(String(32), nullable=False, default="ALIVE")  # ALIVE, BANISHED, MURDERED
    status_round = Column(String(64), nullable=True)
    is_host = Column(Boolean, nullable=False, default=False)
    is_ready = Column(Boolean, nullable=False, default=True)
    is_connected = Column(Boolean, nullable=False, default=True)
    is_ai = Column(Boolean, nullable=False, default=False)
    slot_index = Column(Integer, nullable=False, default=0)
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    game = relationship("GameModel", back_populates="players")

    __table_args__ = (
        Index("idx_game_player", "game_id", "id"),
    )


class VoteModel(Base):
    __tablename__ = "votes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    game_id = Column(String(36), ForeignKey("games.id", ondelete="CASCADE"), nullable=False, index=True)
    round_number = Column(Integer, nullable=False)
    voter_id = Column(String(64), nullable=False)
    target_id = Column(String(64), nullable=False)
    created_at = Column(Float, nullable=False)

    game = relationship("GameModel", back_populates="votes")
    __table_args__ = (Index("idx_vote_game_round_voter", "game_id", "round_number", "voter_id", unique=True),)


class NightActionModel(Base):
    __tablename__ = "night_actions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    game_id = Column(String(36), ForeignKey("games.id", ondelete="CASCADE"), nullable=False, index=True)
    round_number = Column(Integer, nullable=False)
    actor_id = Column(String(64), nullable=False)
    action_type = Column(String(32), nullable=False)  # KILL, SAVE, INVESTIGATE
    target_id = Column(String(64), nullable=False)
    created_at = Column(Float, nullable=False)

    game = relationship("GameModel", back_populates="night_actions")
    __table_args__ = (Index("idx_action_game_round_actor", "game_id", "round_number", "actor_id", unique=True),)


class ChatMessageModel(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    game_id = Column(String(36), ForeignKey("games.id", ondelete="CASCADE"), nullable=False, index=True)
    round_number = Column(Integer, nullable=False, default=1)
    phase = Column(String(32), nullable=False, default="DISCUSSION")
    sender_id = Column(String(64), nullable=False)
    sender_name = Column(String(64), nullable=False)
    avatar_url = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    is_architect = Column(Boolean, nullable=False, default=False)
    is_system = Column(Boolean, nullable=False, default=False)
    is_ai = Column(Boolean, nullable=False, default=False)
    timestamp = Column(Float, nullable=False)

    game = relationship("GameModel", back_populates="chat_messages")


class UserModel(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(64), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    avatar_url = Column(String(255), nullable=False, default="")
    role_badge = Column(String(64), nullable=False, default="Council Initiate")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    stats = relationship("UserStatsModel", back_populates="user", uselist=False, cascade="all, delete-orphan")
    match_history = relationship("MatchHistoryModel", back_populates="user", cascade="all, delete-orphan", order_by="desc(MatchHistoryModel.played_at)")


# Resolve PlayerModel's optional account ownership relationship by foreign key only.


class UserStatsModel(Base):
    __tablename__ = "user_stats"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    games_played = Column(Integer, nullable=False, default=0)
    wins = Column(Integer, nullable=False, default=0)
    losses = Column(Integer, nullable=False, default=0)
    win_rate = Column(Float, nullable=False, default=0.0)
    current_streak = Column(Integer, nullable=False, default=0)
    best_streak = Column(Integer, nullable=False, default=0)
    reputation = Column(Integer, nullable=False, default=1000)
    traitor_count = Column(Integer, nullable=False, default=0)
    faithful_count = Column(Integer, nullable=False, default=0)
    doctor_count = Column(Integer, nullable=False, default=0)
    detective_count = Column(Integer, nullable=False, default=0)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("UserModel", back_populates="stats")


class MatchHistoryModel(Base):
    __tablename__ = "match_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    game_id = Column(String(36), nullable=True)
    room_code = Column(String(16), nullable=False)
    player_role = Column(String(32), nullable=False)
    winning_team = Column(String(32), nullable=False)
    outcome = Column(String(32), nullable=False)  # Victory, Defeat
    player_count = Column(Integer, nullable=False, default=8)
    rounds_played = Column(Integer, nullable=False, default=1)
    duration_seconds = Column(Integer, nullable=False, default=0)
    played_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("UserModel", back_populates="match_history")
