from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
    HTTPException,
    Query,
    Depends,
    Body,
)
from pydantic import BaseModel, Field
from typing import Dict, Optional, List
import uuid
import time
import logging
import secrets
import random

from app.game_engine.models import (
    Player,
    PlayerStatus,
    Role,
    NightActionType,
    ChatMessage,
    GamePhase,
)
from app.game_engine.coordinator import coordinator
from app.communication.manager import manager
from app.ai_engine.agents.architect import architect_agent, ArchitectServiceError
from app.core.player_auth import issue_player_token, verify_player_token
from app.core.account_auth import verify_account_token
from app.api.v1.auth import current_user
from app.database.models import UserModel, PlayerModel, GameModel
from app.database.session import get_db
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)
router = APIRouter()


class CreateRoomRequest(BaseModel):
    host_name: Optional[str] = None
    room_name: Optional[str] = "Council Chamber"
    playerCapacity: Optional[int] = 8
    capacity: Optional[int] = 8
    isPrivate: Optional[bool] = False
    is_private: Optional[bool] = False
    nightDuration: Optional[int] = 30
    discussionDuration: Optional[int] = 120
    votingDuration: Optional[int] = 60


class JoinRoomRequest(BaseModel):
    player_name: Optional[str] = None
    avatar_url: Optional[str] = None
    player_id: Optional[str] = None
    token: Optional[str] = None
    account_token: Optional[str] = None


class ToggleReadyRequest(BaseModel):
    player_id: str
    is_ready: Optional[bool] = None
    token: Optional[str] = None
    account_token: Optional[str] = None


class CastVoteRequest(BaseModel):
    # Accept both camelCase (frontend JS) and snake_case (tests/API)
    playerId: Optional[str] = None
    player_id: Optional[str] = None
    voter_id: Optional[str] = None
    roundNumber: Optional[int] = None
    round_number: Optional[int] = None
    targetId: Optional[str] = None
    target_id: Optional[str] = None
    token: Optional[str] = None
    account_token: Optional[str] = None
    accountToken: Optional[str] = None

    def get_voter_id(self) -> str:
        return self.voter_id or self.playerId or self.player_id or ""

    def get_target_id(self) -> str:
        return self.target_id or self.targetId or ""

    def get_account_token(self) -> str:
        return self.account_token or self.accountToken or ""

    def get_round(self) -> int:
        return self.round_number or self.roundNumber or 1


class NightActionRequest(BaseModel):
    # Accept both camelCase and snake_case
    playerId: Optional[str] = None
    player_id: Optional[str] = None
    actionType: Optional[str] = None
    action_type: Optional[str] = None
    targetId: Optional[str] = None
    target_id: Optional[str] = None
    roundNumber: Optional[int] = None
    round_number: Optional[int] = None
    token: Optional[str] = None
    account_token: Optional[str] = None

    def get_player_id(self) -> str:
        return self.player_id or self.playerId or ""

    def get_action_type(self) -> str:
        return self.action_type or self.actionType or ""

    def get_target_id(self) -> str:
        return self.target_id or self.targetId or ""

    def get_round(self) -> int:
        return self.round_number or self.roundNumber or 1


class SendChatRequest(BaseModel):
    # Accept both camelCase and snake_case
    senderId: Optional[str] = None
    sender_id: Optional[str] = None
    senderName: Optional[str] = None
    sender_name: Optional[str] = None
    avatarUrl: Optional[str] = None
    avatar_url: Optional[str] = None
    content: str = Field(min_length=1, max_length=1000)
    phase: Optional[str] = "DISCUSSION"
    roundNumber: Optional[int] = 1
    token: Optional[str] = None
    account_token: Optional[str] = None


class ArchitectChatRequest(BaseModel):
    player_id: str
    token: str
    account_token: str
    message: str = Field(min_length=1, max_length=1000)


@router.post("/game/create")
@router.post("/rooms")
async def create_game(req: CreateRoomRequest, user: UserModel = Depends(current_user)):
    # Generate 6-char uppercase code (e.g. AIT-7821 or 6-letter alphanumeric)
    room_code = ""
    for _ in range(8):
        candidate = f"AIT-{secrets.token_hex(3).upper()}"
        if await coordinator.get_room(candidate) is None:
            room_code = candidate
            break
    if not room_code:
        raise HTTPException(status_code=503, detail="Could not allocate a room code. Please retry.")

    cap = req.capacity if req.capacity is not None else (req.playerCapacity or 8)
    if cap < 4 or cap > 8:
        raise HTTPException(status_code=422, detail="Player capacity must be between 4 and 8.")
    is_priv = req.is_private if req.is_private is not None else (req.isPrivate or False)
    room_name = req.room_name or f"{user.username}'s Chamber"

    host_id = str(uuid.uuid4())

    engine = coordinator.get_or_create_room(
        room_code=room_code,
        room_name=room_name,
        host_id=host_id,
        capacity=cap,
        is_private=is_priv,
        night_duration=req.nightDuration or 30,
        discussion_duration=req.discussionDuration or 120,
        voting_duration=req.votingDuration or 60,
    )

    host_player = Player(
        id=host_id,
        user_id=user.id,
        name=user.username,
        avatar_url=user.avatar_url,
        is_host=True,
        is_ready=True,
        slot_index=0,
    )
    engine.add_player(host_player)
    try:
        await coordinator.persist_room(engine)
    except Exception as exc:
        coordinator.active_rooms.pop(room_code, None)
        logger.exception("Unable to persist a newly created game")
        raise HTTPException(status_code=503, detail="Game storage is unavailable. Please retry.") from exc

    return {
        "success": True,
        "room_code": room_code,
        "roomCode": room_code,
        "host_id": host_id,
        "hostId": host_id,
        "player_id": host_id,
        "playerId": host_id,
        "session_token": issue_player_token(room_code, host_id),
        "message": f"Room {room_code} created successfully.",
        "room": {
            "id": room_code,
            "roomCode": room_code,
            "roomName": room_name,
            "hostName": user.username,
            "playerCapacity": cap,
            "currentPlayers": 1,
            "isPrivate": is_priv,
            "status": "waiting",
        },
    }


@router.post("/game/{room_code}/join")
@router.post("/rooms/{room_code}/join")
async def join_game(room_code: str, req: JoinRoomRequest, user: UserModel = Depends(current_user), db: AsyncSession = Depends(get_db)):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found.")

    game_res = await db.execute(select(GameModel.id).where(GameModel.room_code == room_code))
    game_id = game_res.scalar_one_or_none()
    if not game_id:
        raise HTTPException(status_code=404, detail="Room not found.")

    prior = await db.execute(select(PlayerModel).where(PlayerModel.game_id == game_id, PlayerModel.user_id == user.id))
    existing = prior.scalars().first()
    reconnecting_player = bool(existing)

    if not reconnecting_player and engine.state.phase != GamePhase.LOBBY:
        raise HTTPException(
            status_code=400, detail="Cannot join room: game is already in progress."
        )
    if existing and existing.id not in engine.state.players:
        raise HTTPException(status_code=409, detail="Player state is unavailable; try again shortly.")
    if not reconnecting_player and len(engine.state.players) >= engine.state.capacity:
        raise HTTPException(status_code=400, detail="Room has reached its player capacity.")

    # Generate or reuse player_id
    # A prior ID is only accepted for reconnecting an existing room member.
    player_id = existing.id if existing else str(uuid.uuid4())

    # Check if player is already in room
    if player_id in engine.state.players:
        player = engine.state.players[player_id]
        player.is_connected = True
    else:
        player = Player(
            id=player_id,
            user_id=user.id,
            name=user.username,
            avatar_url=user.avatar_url,
            is_host=False,
            is_ready=False,
            slot_index=len(engine.state.players),
        )
        engine.add_player(player)

    try:
        await coordinator.persist_room(engine)
    except Exception as exc:
        if not reconnecting_player:
            engine.remove_player(player.id)
        logger.exception("Unable to persist room join")
        raise HTTPException(status_code=503, detail="Game storage is unavailable. Please retry.") from exc

    # Broadcast player joined to room
    await manager.broadcast_room(
        room_code,
        {
            "type": "PLAYER_RECONNECTED" if reconnecting_player else "PLAYER_JOINED",
            "payload": {
                "player": {
                    "id": player.id,
                    "name": player.name,
                    "avatarUrl": player.avatar_url,
                    "isHost": player.is_host,
                    "isReady": player.is_ready,
                    "slotIndex": player.slot_index,
                },
                "players": [
                    {
                        "id": p.id,
                        "name": p.name,
                        "avatarUrl": p.avatar_url,
                        "isHost": p.is_host,
                        "isReady": p.is_ready,
                        "slotIndex": p.slot_index,
                    }
                    for p in engine.state.players.values()
                ],
                "playerCount": len(engine.state.players),
            },
        },
    )

    return {
        "success": True,
        "room_code": room_code,
        "roomCode": room_code,
        "player_id": player.id,
        "playerId": player.id,
        "session_token": issue_player_token(room_code, player.id),
        "player_name": player.name,
        "playerName": player.name,
        "room": {
            "id": room_code,
            "roomCode": room_code,
            "roomName": engine.state.room_name,
            "hostName": engine.state.players.get(engine.state.host_id, player).name,
            "playerCapacity": engine.state.capacity,
            "currentPlayers": len(engine.state.players),
            "isPrivate": engine.state.is_private,
            "status": "waiting",
        },
    }


class LeaveRoomRequest(BaseModel):
    player_id: Optional[str] = None
    token: Optional[str] = None
    account_token: Optional[str] = None


@router.post("/game/{room_code}/leave")
async def leave_game(
    room_code: str,
    req: Optional[LeaveRoomRequest] = None,
    player_id: Optional[str] = Query(None),
    token: Optional[str] = Query(None),
    account_token: Optional[str] = Query(None),
):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found.")

    eff_player_id = (req.player_id if req else None) or player_id
    eff_token = (req.token if req else None) or token
    eff_account_token = (req.account_token if req else None) or account_token

    account_id = verify_account_token(eff_account_token)
    player = engine.state.players.get(eff_player_id or "")
    if not player or not account_id or player.user_id != account_id or not verify_player_token(eff_token, room_code, eff_player_id or ""):
        raise HTTPException(status_code=401, detail="Valid player session required to leave.")

    if engine.state.phase != GamePhase.LOBBY:
        raise HTTPException(status_code=400, detail="Cannot leave a game that has already started.")

    leaving_name = player.name
    engine.remove_player(eff_player_id)

    # Re-index remaining players' slotIndex
    for idx, rem_p in enumerate(engine.state.players.values()):
        rem_p.slot_index = idx

    await coordinator.persist_room(engine)

    # Broadcast PLAYER_LEFT event to all remaining players
    await manager.broadcast_room(
        room_code,
        {
            "type": "PLAYER_LEFT",
            "payload": {
                "playerId": eff_player_id,
                "playerName": leaving_name,
                "newHostId": engine.state.host_id,
                "players": [
                    {
                        "id": p.id,
                        "name": p.name,
                        "avatarUrl": p.avatar_url,
                        "isHost": p.is_host,
                        "isReady": p.is_ready,
                        "isConnected": p.is_connected,
                        "slotIndex": p.slot_index,
                    }
                    for p in engine.state.players.values()
                ],
            },
        },
    )

    return {"success": True, "message": f"{leaving_name} left the room."}


@router.get("/game/{room_code}/state")
@router.get("/rooms/{room_code}")
async def get_game_state(room_code: str, player_id: Optional[str] = Query(None), token: Optional[str] = Query(None), account_token: Optional[str] = Query(None)):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found.")

    account_id = verify_account_token(account_token)
    player = engine.state.players.get(player_id or "")
    if not player and account_id:
        for p in engine.state.players.values():
            if p.user_id == account_id:
                player = p
                player_id = p.id
                break

    if not player or not account_id or player.user_id != account_id:
        raise HTTPException(status_code=401, detail="Valid player session required.")
    viewer = player_id
    return engine.get_public_state(viewer_id=viewer)


@router.get("/game/{room_code}/my-role")
async def get_my_role(room_code: str, player_id: Optional[str] = Query(None), token: Optional[str] = Query(None), account_token: Optional[str] = Query(None)):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found.")
    account_id = verify_account_token(account_token)
    player = engine.state.players.get(player_id or "")
    if not player and account_id:
        for p in engine.state.players.values():
            if p.user_id == account_id:
                player = p
                player_id = p.id
                break

    if not player or not account_id or player.user_id != account_id:
        raise HTTPException(status_code=401, detail="Valid player session required.")

    role = player.role.value
    player_name = player.name

    return {
        "player_id": player_id,
        "player_name": player_name,
        "role": role.lower(),
        "round_number": engine.state.round_number,
    }


@router.post("/game/{room_code}/ready")
async def toggle_player_ready(room_code: str, req: ToggleReadyRequest):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found.")

    player = engine.state.players.get(req.player_id)
    account_id = verify_account_token(req.account_token)
    if not verify_player_token(req.token, room_code, req.player_id) or not player or not account_id or player.user_id != account_id:
        raise HTTPException(status_code=401, detail="Valid player session required.")
    if engine.state.phase != GamePhase.LOBBY:
        raise HTTPException(status_code=409, detail="Ready status is locked after the game starts.")

    is_ready = engine.toggle_ready(req.player_id)
    await coordinator.persist_room(engine)

    await manager.broadcast_room(
        room_code,
        {
            "type": "READY_TOGGLE",
            "payload": {
                "playerId": req.player_id,
                "isReady": is_ready,
                "players": [
                    {
                        "id": p.id,
                        "name": p.name,
                        "avatarUrl": p.avatar_url,
                        "isHost": p.is_host,
                        "isReady": p.is_ready,
                        "slotIndex": p.slot_index,
                    }
                    for p in engine.state.players.values()
                ],
            },
        },
    )
    return {"success": True, "playerId": req.player_id, "isReady": is_ready}


class StartGameRequest(BaseModel):
    host_id: Optional[str] = None
    token: Optional[str] = None
    account_token: Optional[str] = None


class AddTestPlayersRequest(BaseModel):
    count: Optional[int] = None


def _public_lobby_players(engine):
    return [{
        "id": p.id, "name": p.name, "avatarUrl": p.avatar_url,
        "isHost": p.is_host, "isReady": p.is_ready,
        "isConnected": p.is_connected, "isAI": p.is_ai,
        "slotIndex": p.slot_index,
    } for p in engine.state.players.values()]


def _require_lobby_host(engine, user: UserModel):
    host = engine.state.players.get(engine.state.host_id)
    if not host or host.user_id != user.id:
        raise HTTPException(status_code=403, detail="Only the authenticated lobby host can manage test players.")
    if engine.state.phase != GamePhase.LOBBY:
        raise HTTPException(status_code=409, detail="Test players can only be managed while the lobby is open.")
    return host


@router.post("/game/{room_code}/test-players")
async def add_test_players(room_code: str, req: AddTestPlayersRequest, user: UserModel = Depends(current_user)):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found.")
    _require_lobby_host(engine, user)
    available = engine.state.capacity - len(engine.state.players)
    if available <= 0:
        raise HTTPException(status_code=409, detail="The lobby is already at capacity.")
    count = min(max(1, req.count or available), available)
    first_names = ["Mira", "Rowan", "Sage", "Theo", "Nia", "Felix", "Iris", "Ari", "Jules", "Noor", "Kai", "Wren", "Remy", "Zara", "Ezra", "Lena"]
    last_names = ["Vale", "Ashford", "Wilder", "Marlow", "Ellis", "Rook", "Finch", "Holloway", "Sloane", "Bell", "Quinn", "Reed", "Briar", "Voss", "Hart", "Gray"]
    used_names = {p.name for p in engine.state.players.values()}
    already_used_avatars = {p.avatar_url for p in engine.state.players.values() if p.is_ai}
    avatar_ids = [i for i in range(1, 9) if f"/images/test-bots/bot-{i:02}.svg" not in already_used_avatars]
    random.shuffle(avatar_ids)
    additions = []
    for index in range(count):
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        while name in used_names:
            name = f"{random.choice(first_names)} {random.choice(last_names)} {secrets.randbelow(90) + 10}"
        used_names.add(name)
        player = Player(
            id=f"test_{uuid.uuid4().hex}", name=name,
            avatar_url=f"/images/test-bots/bot-{avatar_ids[index]:02}.svg",
            is_ai=True, is_ready=True, is_connected=False,
            slot_index=len(engine.state.players),
        )
        engine.add_player(player)
        additions.append(player)
    await coordinator.persist_room(engine)
    await manager.broadcast_room(room_code, {"type": "PLAYERS_UPDATED", "payload": {"players": _public_lobby_players(engine), "playerCount": len(engine.state.players)}})
    return {"success": True, "added": len(additions), "playerCount": len(engine.state.players), "players": [{"id": p.id, "name": p.name} for p in additions]}


@router.delete("/game/{room_code}/test-players/{player_id}")
async def remove_test_player(room_code: str, player_id: str, user: UserModel = Depends(current_user)):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found.")
    _require_lobby_host(engine, user)
    player = engine.state.players.get(player_id)
    if not player or not player.is_ai:
        raise HTTPException(status_code=404, detail="Test player not found.")
    engine.remove_player(player_id)
    for slot, remaining in enumerate(engine.state.players.values()):
        remaining.slot_index = slot
    await coordinator.persist_room(engine)
    await manager.broadcast_room(room_code, {"type": "PLAYERS_UPDATED", "payload": {"players": _public_lobby_players(engine), "playerCount": len(engine.state.players)}})
    return {"success": True, "playerCount": len(engine.state.players)}


@router.post("/game/{room_code}/start")
async def start_game(
    room_code: str,
    req: Optional[StartGameRequest] = None,
    host_id: Optional[str] = Query(None),
    token: Optional[str] = Query(None),
    account_token: Optional[str] = Query(None),
):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found.")

    effective_host_id = (req.host_id if req else None) or host_id
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found.")

    # Permissions check: only host can start
    if effective_host_id and engine.state.host_id and effective_host_id != engine.state.host_id:
        raise HTTPException(status_code=403, detail="Only the room host can start the game.")
    if not effective_host_id or effective_host_id != engine.state.host_id:
        raise HTTPException(status_code=403, detail="Host identity is required to start the game.")
    effective_token = (req.token if req else None) or token
    host = engine.state.players.get(effective_host_id or "")
    account_id = verify_account_token((req.account_token if req and req.account_token else account_token))
    if not verify_player_token(effective_token, room_code, effective_host_id or "") or not host or not account_id or host.user_id != account_id:
        raise HTTPException(status_code=401, detail="Valid host session required.")
    if len(engine.state.players) < 4:
        raise HTTPException(status_code=400, detail="At least 4 real players are required to start.")
    if any(not player.is_ready for player in engine.state.players.values()):
        raise HTTPException(status_code=400, detail="All players must be ready before starting.")

    try:
        engine.start_game()
        await coordinator.persist_room(engine)

        # Broadcast GAME_STARTED and PHASE_CHANGED
        await manager.broadcast_room(
            room_code,
            {
                "type": "GAME_STARTED",
                "payload": engine.get_public_state(),
            },
        )
        await manager.broadcast_room(
            room_code,
            {
                "type": "PHASE_CHANGED",
                "payload": engine.get_public_state(),
            },
        )

        return {"success": True, "status": "started", "phase": engine.state.phase.value}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/game/{room_code}/vote")
async def cast_vote(room_code: str, req: CastVoteRequest):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found.")

    voter_id = req.get_voter_id()
    account_token = req.get_account_token()
    account_id = verify_account_token(account_token)
    voter = engine.state.players.get(voter_id)
    if not voter and account_id:
        for p in engine.state.players.values():
            if p.user_id == account_id:
                voter = p
                voter_id = p.id
                break

    if not voter or not account_id or voter.user_id != account_id:
        raise HTTPException(status_code=401, detail="Valid player session required.")
    if not verify_player_token(req.token, room_code, voter_id):
        raise HTTPException(status_code=401, detail="Valid player session required.")

    if req.get_round() != engine.state.round_number:
        raise HTTPException(status_code=409, detail="Voting round is no longer active.")
    if engine.state.phase != GamePhase.VOTING:
        raise HTTPException(status_code=409, detail="Voting is not open.")
    if engine.state.phase_ends_at <= time.time():
        raise HTTPException(status_code=409, detail="Voting deadline has passed.")

    # A player may cast only one vote in the active voting phase.
    # Check if this player already voted this round
    already_voted = any(
        v.voter_id == voter_id and v.round_number == engine.state.round_number
        for v in engine.state.votes
    )
    if already_voted:
        raise HTTPException(status_code=409, detail="You have already voted this round.")

    success = engine.cast_vote(voter_id=voter_id, target_id=req.get_target_id())
    if not success:
        raise HTTPException(status_code=409, detail="Vote is invalid, you are not eligible, or this vote was already recorded.")

    try:
        await coordinator.persist_room(engine)
    except Exception as exc:
        if engine.state.votes and engine.state.votes[-1].voter_id == voter_id:
            engine.state.votes.pop()
        logger.exception("Unable to persist vote for room %s", room_code)
        raise HTTPException(status_code=503, detail="Vote storage is unavailable. Please retry.") from exc

    # Broadcast vote count without leaking target
    await manager.broadcast_room(
        room_code,
        {
            "type": "VOTE_CAST",
            "payload": {
                "voterId": voter_id,
                "totalVotesCast": len(engine.state.votes),
                "eligibleVoters": sum(1 for p in engine.state.players.values() if p.status == PlayerStatus.ALIVE),
            },
        },
    )
    if engine.are_all_votes_in():
        await coordinator.advance_phase(engine, expected_phase=GamePhase.VOTING, allow_early=True)

    return {"success": True, "message": "Vote recorded."}


@router.post("/game/{room_code}/night-action")
async def submit_night_action(room_code: str, req: NightActionRequest):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found.")
    actor_id = req.get_player_id()
    account_token = req.account_token
    account_id = verify_account_token(account_token)
    actor = engine.state.players.get(actor_id)
    if not actor and account_id:
        for p in engine.state.players.values():
            if p.user_id == account_id:
                actor = p
                actor_id = p.id
                break

    if not actor or not account_id or actor.user_id != account_id:
        raise HTTPException(status_code=401, detail="Valid player session required.")

    # Map frontend action types (elimination/protection/investigation) to backend enum
    ACTION_MAP = {
        "elimination": NightActionType.KILL,
        "kill": NightActionType.KILL,
        "KILL": NightActionType.KILL,
        "protection": NightActionType.SAVE,
        "save": NightActionType.SAVE,
        "SAVE": NightActionType.SAVE,
        "investigation": NightActionType.INVESTIGATE,
        "investigate": NightActionType.INVESTIGATE,
        "INVESTIGATE": NightActionType.INVESTIGATE,
    }
    raw_action = req.get_action_type()
    action_type = ACTION_MAP.get(raw_action)
    if action_type is None:
        return {"success": False, "message": f"Unknown action type: {raw_action}"}

    success = engine.record_night_action(
        actor_id=actor_id,
        action_type=action_type,
        target_id=req.get_target_id(),
    )
    if not success:
        return {"success": False, "message": "Action not permitted for this role/status."}

    private_result = None
    if action_type == NightActionType.INVESTIGATE:
        target = engine.state.players[req.get_target_id()]
        private_result = {"targetId": target.id, "targetName": target.name,
                          "isTraitor": target.role == Role.TRAITOR}

    await coordinator.persist_room(engine)

    # Check if all traitors have acted:
    required_actors = [
        p.id
        for p in engine.state.players.values()
        if p.status == PlayerStatus.ALIVE and p.role in (Role.TRAITOR, Role.DOCTOR, Role.DETECTIVE)
    ]
    actors = {a.actor_id for a in engine.state.night_actions}
    if required_actors and set(required_actors).issubset(actors):
        await coordinator.advance_phase(engine, expected_phase=GamePhase.NIGHT, allow_early=True)

    return {"success": True, "message": "Night action submitted.",
            "investigationResult": private_result}


@router.post("/game/{room_code}/advance-phase")
async def advance_game_phase(
    room_code: str,
    req: Optional[dict] = Body(default=None),
    player_id: Optional[str] = Query(None),
    token: Optional[str] = Query(None),
    account_token: Optional[str] = Query(None),
):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found.")

    pid = (req.get("player_id") or req.get("playerId") if req else None) or player_id or ""
    tok = (req.get("token") if req else None) or token or ""
    acc = (req.get("account_token") or req.get("accountToken") if req else None) or account_token or ""

    player = engine.state.players.get(pid)
    account_id = verify_account_token(acc)
    if not player or not account_id or player.user_id != account_id or not verify_player_token(tok, room_code, pid):
        raise HTTPException(status_code=403, detail="Valid player session required.")

    # The Morning screen can remain visible briefly after the authoritative
    # timer has already moved the room forward. Treat a retried Morning action
    # as a sync request so it cannot accidentally advance DISCUSSION to VOTING.
    expected_phase_raw = (req.get("expected_phase") if req else None) or ""
    if str(expected_phase_raw).upper() == GamePhase.MORNING.value:
        current_phase = engine.state.phase
        if current_phase == GamePhase.MORNING:
            new_phase = await coordinator.advance_phase(
                engine, expected_phase=GamePhase.MORNING, allow_early=True
            )
            return {"success": True, "phase": new_phase}
        if current_phase in (
            GamePhase.DISCUSSION,
            GamePhase.VOTING,
            GamePhase.VOTING_RESULTS,
            GamePhase.GAME_OVER,
        ):
            return {"success": True, "phase": current_phase.value, "already_advanced": True}
        return {
            "success": False,
            "phase": current_phase.value,
            "message": "The game is no longer in the Morning phase.",
        }

    if engine.state.phase not in (GamePhase.ROLE_REVEAL, GamePhase.MORNING, GamePhase.DISCUSSION, GamePhase.VOTING_RESULTS):
        return {"success": False, "message": "Phase advances automatically or upon action completion."}

    new_phase = await coordinator.advance_phase(engine, expected_phase=engine.state.phase, allow_early=True)
    return {"success": True, "phase": new_phase}


@router.get("/game/{room_code}/messages")
async def get_messages(room_code: str, player_id: Optional[str] = Query(None), token: Optional[str] = Query(None), account_token: Optional[str] = Query(None)):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found.")
    player = engine.state.players.get(player_id or "")
    account_id = verify_account_token(account_token)
    if not player or not account_id or player.user_id != account_id or not verify_player_token(token, room_code, player_id or ""):
        raise HTTPException(status_code=401, detail="Valid player session required.")
    return {
        "messages": [
            {
                "id": m.id,
                "senderId": m.sender_id,
                "senderName": m.sender_name,
                "avatarUrl": m.avatar_url,
                "text": m.content,
                "content": m.content,
                "timestamp": time.strftime("%I:%M %p", time.localtime(m.timestamp)),
                "isArchitect": m.is_architect,
                "isSystem": m.is_system,
                "isAI": m.is_ai,
            }
            for m in engine.state.chat_history if m.phase in ("LOBBY", "DISCUSSION")
        ]
    }


async def respond_to_discussion(room_code: str, speaker_name: str, speaker_text: str):
    await asyncio.sleep(1.2)
    engine = await coordinator.get_room(room_code)
    if not engine or engine.state.phase != GamePhase.DISCUSSION:
        return

    import random
    text_lower = speaker_text.lower()
    is_architect_query = "architect" in text_lower or "?" in speaker_text or "hint" in text_lower or "who" in text_lower

    if is_architect_query:
        architect_replies = [
            f"The Architect observes: Deception thrives in ambiguity. Consider who steered the accusations this morning.",
            f"The Architect observes: Truth is not a matter of volume, {speaker_name}. Watch whose gaze wavers.",
            f"The Architect observes: The shadows cannot eliminate all of you. Every contradiction recorded will soon be weighed at the ballot box.",
            f"The Architect observes: Analyze not who spoke first, but who immediately agreed.",
        ]
        chosen = random.choice(architect_replies)
        arch_msg = ChatMessage(
            sender_id="architect",
            sender_name="The Architect",
            avatar_url="/images/architect_gameplay.png",
            content=chosen,
            is_architect=True,
        )
        engine.add_chat_message(arch_msg)
        await coordinator.persist_room(engine)
        await manager.broadcast_room(
            room_code,
            {
                "type": "DISCUSSION_MESSAGE",
                "payload": {
                    "id": arch_msg.id,
                    "senderId": "architect",
                    "senderName": "The Architect",
                    "avatarUrl": "/images/architect_gameplay.png",
                    "text": chosen,
                    "content": chosen,
                    "timestamp": time.strftime("%I:%M %p", time.localtime(arch_msg.timestamp)),
                    "isArchitect": True,
                },
            },
        )
        return

    alive_bots = [
        p for p in engine.state.players.values()
        if p.status == PlayerStatus.ALIVE and p.name != speaker_name
    ]
    if not alive_bots:
        return

    bot = random.choice(alive_bots)
    other_alive = [p.name for p in engine.state.players.values() if p.status == PlayerStatus.ALIVE and p.id != bot.id and p.name != speaker_name]
    target_name = random.choice(other_alive) if other_alive else "someone"

    bot_replies = [
        f"I hear your point, {speaker_name}. But notice how quiet {target_name} has been since dawn.",
        f"We have to be cautious with accusations. Did anyone see {target_name}'s reaction when the victim was announced?",
        f"I agree with {speaker_name} on this. The logic holds up.",
        f"Let us make sure we do not banish another Faithful. We need verified facts before casting ballots.",
        f"I suspect {target_name} is deflecting. Look at who they voted against in the past.",
    ]
    reply = random.choice(bot_replies)
    bot_msg = ChatMessage(
        sender_id=bot.id,
        sender_name=bot.name,
        avatar_url=bot.avatar_url or "",
        content=reply,
    )
    engine.add_chat_message(bot_msg)
    await coordinator.persist_room(engine)
    await manager.broadcast_room(
        room_code,
        {
            "type": "DISCUSSION_MESSAGE",
            "payload": {
                "id": bot_msg.id,
                "senderId": bot.id,
                "senderName": bot.name,
                "avatarUrl": bot.avatar_url or "",
                "text": reply,
                "content": reply,
                "timestamp": time.strftime("%I:%M %p", time.localtime(bot_msg.timestamp)),
                "isArchitect": False,
            },
        },
    )


@router.post("/game/{room_code}/chat")
async def send_chat_message(room_code: str, req: SendChatRequest):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found.")
    sender_id = req.sender_id or req.senderId or ""
    sender = engine.state.players.get(sender_id)
    account_id = verify_account_token(req.account_token)
    if not verify_player_token(req.token, room_code, sender_id) or not sender or not account_id or sender.user_id != account_id:
        raise HTTPException(status_code=401, detail="Valid player session required.")
    player = engine.state.players[sender_id]
    if player.status != PlayerStatus.ALIVE or engine.state.phase not in (GamePhase.LOBBY, GamePhase.DISCUSSION):
        raise HTTPException(status_code=403, detail="Chat is unavailable to this player in this phase.")
    clean_content = req.content.strip()
    if not clean_content or len(clean_content) > 1000:
        raise HTTPException(status_code=422, detail="Message must contain 1 to 1000 characters.")

    msg = ChatMessage(
        sender_id=sender_id,
        sender_name=player.name,
        avatar_url=player.avatar_url,
        content=clean_content,
        phase=req.phase or engine.state.phase.value,
        round_number=engine.state.round_number,
    )
    engine.add_chat_message(msg)
    try:
        await coordinator.persist_room(engine)
    except Exception as exc:
        if engine.state.chat_history and engine.state.chat_history[-1].id == msg.id:
            engine.state.chat_history.pop()
        logger.exception("Unable to persist chat message for room %s", room_code)
        raise HTTPException(status_code=503, detail="Message storage is unavailable. Please retry.") from exc

    payload = {
        "id": msg.id,
        "senderId": msg.sender_id,
        "senderName": msg.sender_name,
        "avatarUrl": msg.avatar_url,
        "text": msg.content,
        "content": msg.content,
        "timestamp": time.strftime("%I:%M %p", time.localtime(msg.timestamp)),
        "isArchitect": msg.is_architect,
        "isSystem": msg.is_system,
        "isAI": msg.is_ai,
    }

    await manager.broadcast_room(
        room_code,
        {"type": "DISCUSSION_MESSAGE", "payload": payload},
    )

    if engine.state.phase == GamePhase.DISCUSSION:
        asyncio.create_task(respond_to_discussion(room_code, player.name, clean_content))

    return {"success": True, "message": payload}


@router.post("/game/{room_code}/architect-chat")
async def consult_architect(room_code: str, req: ArchitectChatRequest):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found.")
    player = engine.state.players.get(req.player_id)
    account_id = verify_account_token(req.account_token)
    if (not player or not account_id or player.user_id != account_id
            or not verify_player_token(req.token, room_code, req.player_id)):
        raise HTTPException(status_code=401, detail="Valid player session required.")
    if player.status != PlayerStatus.ALIVE:
        raise HTTPException(status_code=403, detail="Only living players may consult the Architect.")
    if engine.state.phase != GamePhase.DISCUSSION:
        raise HTTPException(status_code=409, detail="The Architect is available during the discussion phase.")

    alive_names = [p.name for p in engine.state.players.values() if p.status == PlayerStatus.ALIVE]
    recent_public_chat = [
        f"{message.sender_name}: {message.content}"
        for message in engine.state.chat_history
        if message.phase == GamePhase.DISCUSSION.value and not message.is_system
    ][-12:]
    context = (
        f"Room: {room_code}\nRound: {engine.state.round_number}\nPhase: Discussion\n"
        f"Living players: {', '.join(alive_names)}\n"
        "Recent public discussion:\n"
        + ("\n".join(recent_public_chat) if recent_public_chat else "No discussion messages yet.")
    )
    try:
        answer = await architect_agent.answer_discussion_question(req.message.strip(), context)
    except ArchitectServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected Architect request failure for room %s", room_code)
        raise HTTPException(status_code=502, detail="The Architect AI failed to respond. Please try again.") from exc
    return {"success": True, "answer": answer, "speaker": "The Architect"}


@router.get("/game/{room_code}/architect-hint")
async def get_architect_hint(room_code: str):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    round_number = engine.state.round_number if engine else 1
    alive_players = [
        p.name for p in (engine.state.players.values() if engine else [])
    ]
    hint = await architect_agent.generate_discussion_hint(
        round_number=round_number,
        player_names=alive_players or ["The Council"],
    )
    return {
        "roundNumber": round_number,
        "hint": hint,
        "speaker": "The Architect",
    }


# Unified WebSocket router for Lobby, Discussion, and Global Game Events
@router.websocket("/ws/game/{room_code}")
@router.websocket("/ws/game/{room_code}/{phase}")
@router.websocket("/api/v1/ws/game/{room_code}")
@router.websocket("/api/v1/ws/game/{room_code}/{phase}")
@router.websocket("/api/v1/ws/lobby/{room_code}")
async def unified_game_websocket(
    websocket: WebSocket,
    room_code: str,
    phase: Optional[str] = None,
    player_id: Optional[str] = None,
    token: Optional[str] = None,
    account_token: Optional[str] = None,
):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    # Only existing players can establish a room socket; otherwise callers
    # could impersonate a member by supplying their ID in the query string.
    account_id = verify_account_token(account_token)
    player = engine.state.players.get(player_id or "") if engine else None
    # Fallback: resolve player by account_id when player_id is a user UUID
    if not player and account_id and engine:
        for p in engine.state.players.values():
            if p.user_id == account_id:
                player = p
                player_id = p.id
                break
    # Also try resolving the token against the resolved player_id
    if (not engine or not player_id or not player or not account_id or player.user_id != account_id
            or not verify_player_token(token, room_code, player_id)):
        await websocket.close(code=4404)
        return
    await manager.connect(room_code, player_id, websocket)

    try:
        was_connected = engine.state.players[player_id].is_connected
        engine.set_player_connection(player_id, True)
        await coordinator.persist_room(engine)

        # Initial sync
        await manager.send_personal(
            websocket,
            {
                "type": "INITIAL_SYNC",
                "payload": engine.get_public_state(viewer_id=player_id),
            },
        )
        if not was_connected:
            await manager.broadcast_room(room_code, {
                "type": "PLAYER_RECONNECTED",
                "payload": {"playerId": player_id},
            })

        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            payload = data.get("payload", {})

            if msg_type in ("CHAT_MESSAGE", "DISCUSSION_MESSAGE"):
                text = (payload.get("content") or payload.get("text") or "").strip()
                sender_id = player_id
                sender = engine.state.players[player_id]
                sender_name = sender.name
                avatar_url = sender.avatar_url

                if (text and len(text) <= 1000 and sender.status == PlayerStatus.ALIVE
                        and engine.state.phase in (GamePhase.LOBBY, GamePhase.DISCUSSION)):
                    msg = ChatMessage(
                        sender_id=sender_id,
                        sender_name=sender_name,
                        avatar_url=avatar_url,
                        content=text.strip(),
                    )
                    engine.add_chat_message(msg)
                    await coordinator.persist_room(engine)
                    out_payload = {
                        "id": msg.id,
                        "senderId": msg.sender_id,
                        "senderName": msg.sender_name,
                        "avatarUrl": msg.avatar_url,
                        "text": msg.content,
                        "content": msg.content,
                        "timestamp": time.strftime("%I:%M %p", time.localtime(msg.timestamp)),
                        "isArchitect": msg.is_architect,
                    }
                    await manager.broadcast_room(
                        room_code,
                        {"type": "DISCUSSION_MESSAGE", "payload": out_payload},
                    )

                    if engine.state.phase == GamePhase.DISCUSSION:
                        asyncio.create_task(respond_to_discussion(room_code, sender_name, text.strip()))

            elif msg_type == "READY_TOGGLE":
                target_id = player_id
                socket_player = engine.state.players.get(target_id or "") if engine else None
                if (engine and engine.state.phase == GamePhase.LOBBY and socket_player
                        and verify_player_token(token, room_code, target_id)
                        and socket_player.user_id == account_id):
                    is_ready = engine.toggle_ready(target_id)
                    await coordinator.persist_room(engine)
                    await manager.broadcast_room(
                        room_code,
                        {
                            "type": "READY_TOGGLE",
                            "payload": {
                                "playerId": target_id,
                                "isReady": is_ready,
                                "players": [
                                    {
                                        "id": p.id,
                                        "name": p.name,
                                        "avatarUrl": p.avatar_url,
                                        "isHost": p.is_host,
                                        "isReady": p.is_ready,
                                        "slotIndex": p.slot_index,
                                    }
                                    for p in engine.state.players.values()
                                ],
                            },
                        },
                    )

            elif msg_type == "START_GAME":
                if engine and player_id == engine.state.host_id and verify_player_token(token, room_code, player_id) and engine.state.players[player_id].user_id == account_id:
                    try:
                        engine.start_game()
                        await coordinator.persist_room(engine)
                        await manager.broadcast_room(
                            room_code,
                            {
                                "type": "GAME_STARTED",
                                "payload": engine.get_public_state(),
                            },
                        )
                        await manager.broadcast_room(
                            room_code,
                            {
                                "type": "PHASE_CHANGED",
                                "payload": engine.get_public_state(),
                            },
                        )
                    except Exception as e:
                        await manager.send_personal(
                            websocket,
                            {"type": "ERROR", "message": str(e)},
                        )

            elif msg_type == "PING":
                await manager.send_personal(websocket, {"type": "PONG"})

    except WebSocketDisconnect:
        disc = manager.disconnect(websocket)
        if disc:
            r_code, p_id = disc
            engine = await coordinator.get_room(r_code)
            if engine and p_id in engine.state.players:
                if p_id not in manager.get_connected_player_ids(r_code):
                    engine.set_player_connection(p_id, False)
                    await coordinator.persist_room(engine)
                    await manager.broadcast_room(
                    r_code,
                    {
                        "type": "PLAYER_DISCONNECTED",
                        "payload": {"playerId": p_id,
                                    "state": engine.get_public_state()},
                    },
                    )
    except Exception as e:
        logger.error(f"WebSocket error in room {room_code}: {e}")
        manager.disconnect(websocket)
