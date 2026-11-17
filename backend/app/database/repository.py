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
                name=p.name,
                avatar_url=p.avatar_url,
                role=p.role.value,
                status=p.status.value,
                status_round=p.status_round,
                is_host=p.is_host,
                is_ready=p.is_ready,
                is_connected=p.is_connected,
                slot_index=p.slot_index,
            )
            session.add(db_p)
        else:
            db_p.name = p.name
            db_p.avatar_url = p.avatar_url
            db_p.role = p.role.value
            db_p.status = p.status.value
            db_p.status_round = p.status_round
            db_p.is_host = p.is_host
            db_p.is_ready = p.is_ready
            db_p.is_connected = p.is_connected
            db_p.slot_index = p.slot_index

    # Replace per-round action records from authoritative in-memory state.
    # The game engine owns replacement semantics for a player's current vote/action.
    for model in (VoteModel, NightActionModel):
        rows = await session.execute(select(model).where(model.game_id == game.id))
        for row in rows.scalars().all():
            await session.delete(row)
    await session.flush()
    for vote in state.votes:
        session.add(VoteModel(game_id=game.id, round_number=vote.round_number,
                              voter_id=vote.voter_id, target_id=vote.target_id,
                              created_at=__import__("time").time()))
    for action in state.night_actions:
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
            slot_index=p.slot_index,
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
