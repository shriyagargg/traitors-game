from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.game_engine.engine import GameEngine
from app.game_engine.models import (
    Player,
    PlayerStatus,
    Role,
    Vote,
    NightAction,
    NightActionType,
    ChatMessage,
    GamePhase,
    GameOutcome,
    VoteTally,
)
from app.database.models import (
    GameModel,
    PlayerModel,
    VoteModel,
    NightActionModel,
    ChatMessageModel,
    UserStatsModel,
    MatchHistoryModel,
)


async def save_game_to_db(session: AsyncSession, engine: GameEngine) -> GameModel:
    state = engine.state
    stmt = select(GameModel).where(GameModel.room_code == state.room_code)
    result = await session.execute(stmt)
    game = result.scalars().first()

    if not game:
        game = GameModel(
            room_code=state.room_code,
            room_name=state.room_name,
            host_id=state.host_id,
            status=state.status,
            current_phase=state.phase.value,
            current_round=state.round_number,
            capacity=state.capacity,
            is_private=state.is_private,
            night_duration=state.night_duration,
            discussion_duration=state.discussion_duration,
            voting_duration=state.voting_duration,
            phase_started_at=state.phase_started_at,
            phase_ends_at=state.phase_ends_at,
            banished_player_id=state.banished_player_id,
            murdered_player_id=state.murdered_player_id,
            architect_announcement=state.architect_announcement,
            outcome=state.outcome.value,
        )
        session.add(game)
        await session.flush()
    else:
        game.room_name = state.room_name
        game.host_id = state.host_id
        game.status = state.status
        game.current_phase = state.phase.value
        game.current_round = state.round_number
        game.capacity = state.capacity
        game.is_private = state.is_private
        game.night_duration = state.night_duration
        game.discussion_duration = state.discussion_duration
        game.voting_duration = state.voting_duration
        game.phase_started_at = state.phase_started_at
        game.phase_ends_at = state.phase_ends_at
        game.banished_player_id = state.banished_player_id
        game.murdered_player_id = state.murdered_player_id
        game.architect_announcement = state.architect_announcement
        game.outcome = state.outcome.value

    # Sync players
    current_player_ids = set(state.players.keys())
    existing_players = await session.execute(select(PlayerModel).where(PlayerModel.game_id == game.id))
    for db_p in existing_players.scalars().all():
        if db_p.id not in current_player_ids:
            await session.delete(db_p)
    await session.flush()

    for p in state.players.values():
        p_stmt = select(PlayerModel).where(
            PlayerModel.game_id == game.id, PlayerModel.id == p.id
        )
        p_res = await session.execute(p_stmt)
        db_p = p_res.scalars().first()
        if not db_p:
            db_p = PlayerModel(
                id=p.id,
                game_id=game.id,
                user_id=getattr(p, "user_id", None),
                name=p.name,
                avatar_url=p.avatar_url,
                role=p.role.value,
                status=p.status.value,
                status_round=p.status_round,
                is_host=p.is_host,
                is_ready=p.is_ready,
                is_connected=p.is_connected,
                is_ai=p.is_ai,
                slot_index=p.slot_index,
            )
            session.add(db_p)
        else:
            db_p.name = p.name
            db_p.user_id = getattr(p, "user_id", db_p.user_id)
            db_p.avatar_url = p.avatar_url
            db_p.role = p.role.value
            db_p.status = p.status.value
            db_p.status_round = p.status_round
            db_p.is_host = p.is_host
            db_p.is_ready = p.is_ready
            db_p.is_connected = p.is_connected
            db_p.is_ai = p.is_ai
            db_p.slot_index = p.slot_index

    # Insert missing records while preserving database uniqueness and timestamps.
    existing_votes_res = await session.execute(select(VoteModel).where(VoteModel.game_id == game.id))
    existing_votes = {(v.round_number, v.voter_id) for v in existing_votes_res.scalars().all()}
    for vote in state.votes:
        if (vote.round_number, vote.voter_id) not in existing_votes:
            session.add(VoteModel(game_id=game.id, round_number=vote.round_number,
                                  voter_id=vote.voter_id, target_id=vote.target_id,
                                  created_at=__import__("time").time()))
    existing_actions_res = await session.execute(select(NightActionModel).where(NightActionModel.game_id == game.id))
    existing_actions = {(a.round_number, a.actor_id) for a in existing_actions_res.scalars().all()}
    for action in state.night_actions:
        if (action.round_number, action.actor_id) not in existing_actions:
            session.add(NightActionModel(game_id=game.id, round_number=action.round_number,
                                         actor_id=action.actor_id, action_type=action.action_type.value,
                                         target_id=action.target_id, created_at=__import__("time").time()))
    known_messages = await session.execute(select(ChatMessageModel.id).where(ChatMessageModel.game_id == game.id))
    known_ids = set(known_messages.scalars().all())
    for message in state.chat_history:
        if message.id not in known_ids:
            session.add(ChatMessageModel(id=message.id, game_id=game.id,
                round_number=message.round_number, phase=message.phase,
                sender_id=message.sender_id, sender_name=message.sender_name,
                avatar_url=message.avatar_url, content=message.content,
                is_architect=message.is_architect, is_system=message.is_system,
                is_ai=message.is_ai,
                timestamp=message.timestamp))

    await session.commit()
    return game


async def load_game_from_db(
    session: AsyncSession, room_code: str
) -> Optional[GameEngine]:
    stmt = (
        select(GameModel)
        .where(GameModel.room_code == room_code.upper())
        .options(
            selectinload(GameModel.players),
            selectinload(GameModel.votes),
            selectinload(GameModel.night_actions),
            selectinload(GameModel.chat_messages),
        )
    )
    result = await session.execute(stmt)
    game = result.scalars().first()
    if not game:
        return None

    engine = GameEngine(
        room_code=game.room_code,
        room_name=game.room_name,
        host_id=game.host_id,
        capacity=game.capacity,
        is_private=game.is_private,
        night_duration=game.night_duration,
        discussion_duration=game.discussion_duration,
        voting_duration=game.voting_duration,
    )
    engine.state.status = game.status
    engine.state.phase = GamePhase(game.current_phase)
    engine.state.round_number = game.current_round
    engine.state.phase_started_at = game.phase_started_at
    engine.state.phase_ends_at = game.phase_ends_at
    engine.state.banished_player_id = game.banished_player_id
    engine.state.murdered_player_id = game.murdered_player_id
    engine.state.architect_announcement = game.architect_announcement
    engine.state.outcome = GameOutcome(game.outcome)

    # Reconstruct players
    for p in game.players:
        engine.state.players[p.id] = Player(
            id=p.id,
            name=p.name,
            avatar_url=p.avatar_url,
            role=Role(p.role),
            status=PlayerStatus(p.status),
            status_round=p.status_round,
            is_host=p.is_host,
            is_ready=p.is_ready,
            is_connected=p.is_connected,
            is_ai=p.is_ai,
            slot_index=p.slot_index,
            user_id=p.user_id,
        )

    # Reconstruct chat messages
    for m in game.chat_messages:
        engine.state.chat_history.append(
            ChatMessage(
                id=m.id,
                sender_id=m.sender_id,
                sender_name=m.sender_name,
                avatar_url=m.avatar_url,
                content=m.content,
                timestamp=m.timestamp,
                is_architect=m.is_architect,
                is_system=m.is_system,
                is_ai=m.is_ai,
                phase=m.phase,
                round_number=m.round_number,
            )
        )

    engine.state.votes = [Vote(voter_id=v.voter_id, target_id=v.target_id,
                                round_number=v.round_number) for v in game.votes]
    engine.state.night_actions = [NightAction(actor_id=a.actor_id,
        action_type=NightActionType(a.action_type), target_id=a.target_id,
        round_number=a.round_number) for a in game.night_actions]
    if engine.state.phase in (GamePhase.VOTING_RESULTS, GamePhase.GAME_OVER):
        counts = {}
        for vote in engine.state.votes:
            counts[vote.target_id] = counts.get(vote.target_id, 0) + 1
        total = len(engine.state.votes)
        engine.state.vote_tally = [VoteTally(
            target_id=target_id,
            target_name=engine.state.players[target_id].name,
            votes_count=count,
            percentage=round(count / total * 100, 1) if total else 0,
        ) for target_id, count in counts.items() if target_id in engine.state.players]
        engine.state.vote_tally.sort(key=lambda tally: tally.votes_count, reverse=True)

    return engine


async def load_active_games_from_db(session: AsyncSession) -> list[GameEngine]:
    """Load unfinished rooms so the authoritative timer resumes after restart."""
    stmt = (
        select(GameModel)
        .where(GameModel.status == "PLAYING")
        .options(
            selectinload(GameModel.players),
            selectinload(GameModel.votes),
            selectinload(GameModel.night_actions),
            selectinload(GameModel.chat_messages),
        )
    )
    result = await session.execute(stmt)
    rooms: list[GameEngine] = []
    for game in result.scalars().all():
        # Reuse the same reconstruction path with the current transaction.
        loaded = await load_game_from_db(session, game.room_code)
        if loaded:
            rooms.append(loaded)
    return rooms


async def record_game_stats(session: AsyncSession, engine: GameEngine):
    """Update UserStatsModel and append MatchHistoryModel for all users when game reaches GAME_OVER."""
    state = engine.state
    if state.phase != GamePhase.GAME_OVER:
        return

    # Check if match history was already recorded for this room to avoid duplicates
    existing_history = await session.execute(
        select(MatchHistoryModel.id).where(MatchHistoryModel.room_code == state.room_code).limit(1)
    )
    if existing_history.scalars().first():
        return

    traitor_won = (state.outcome == GameOutcome.TRAITOR_VICTORY)
    winning_team_str = "Traitor" if traitor_won else "Faithful"
    duration = int(__import__("time").time() - (state.phase_started_at or __import__("time").time()))

    for p in state.players.values():
        if not getattr(p, "user_id", None):
            continue

        user_id = p.user_id
        is_traitor = (p.role == Role.TRAITOR)
        is_win = (is_traitor == traitor_won)
        outcome_str = "Victory" if is_win else "Defeat"

        match_record = MatchHistoryModel(
            user_id=user_id,
            room_code=state.room_code,
            player_role=p.role.value,
            winning_team=winning_team_str,
            outcome=outcome_str,
            player_count=len(state.players),
            rounds_played=state.round_number,
            duration_seconds=max(60, duration),
        )
        session.add(match_record)

        stats_res = await session.execute(select(UserStatsModel).where(UserStatsModel.user_id == user_id))
        stats = stats_res.scalars().first()
        if not stats:
            stats = UserStatsModel(user_id=user_id)
            session.add(stats)

        stats.games_played += 1
        if is_win:
            stats.wins += 1
            stats.current_streak += 1
            stats.best_streak = max(stats.best_streak, stats.current_streak)
            stats.reputation += 25
        else:
            stats.losses += 1
            stats.current_streak = 0
            stats.reputation = max(500, stats.reputation - 10)

        stats.win_rate = round((stats.wins / stats.games_played) * 100, 1)

        if p.role == Role.TRAITOR:
            stats.traitor_count += 1
        elif p.role == Role.DOCTOR:
            stats.doctor_count += 1
        elif p.role == Role.DETECTIVE:
            stats.detective_count += 1
        else:
            stats.faithful_count += 1

    await session.commit()
