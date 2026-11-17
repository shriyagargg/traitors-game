from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
    HTTPException,
    Query,
)
from pydantic import BaseModel, Field
from typing import Dict, Optional, List
import uuid
import time
import logging
import secrets

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
from app.ai_engine.agents.architect import architect_agent
from app.core.player_auth import issue_player_token, verify_player_token

logger = logging.getLogger(__name__)
router = APIRouter()


class CreateRoomRequest(BaseModel):
    host_name: str = Field(min_length=1, max_length=64)
    room_name: Optional[str] = "Council Chamber"
    playerCapacity: Optional[int] = 8
    capacity: Optional[int] = 8
    isPrivate: Optional[bool] = False
    is_private: Optional[bool] = False
    nightDuration: Optional[int] = 30
    discussionDuration: Optional[int] = 120
    votingDuration: Optional[int] = 60


class JoinRoomRequest(BaseModel):
    player_name: str = Field(min_length=1, max_length=64)
    avatar_url: Optional[str] = "/images/player_somya.png"
    player_id: Optional[str] = None
    token: Optional[str] = None


class ToggleReadyRequest(BaseModel):
    player_id: str
    is_ready: Optional[bool] = None
    token: Optional[str] = None


class CastVoteRequest(BaseModel):
    # Accept both camelCase (frontend JS) and snake_case (tests/API)
    playerId: Optional[str] = None
    voter_id: Optional[str] = None
    roundNumber: Optional[int] = None
    round_number: Optional[int] = None
    targetId: Optional[str] = None
    target_id: Optional[str] = None
    token: Optional[str] = None

    def get_voter_id(self) -> str:
        return self.voter_id or self.playerId or ""

    def get_target_id(self) -> str:
        return self.target_id or self.targetId or ""

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
    avatarUrl: Optional[str] = "/images/player_somya.png"
    avatar_url: Optional[str] = None
    content: str = Field(min_length=1, max_length=1000)
    phase: Optional[str] = "DISCUSSION"
    roundNumber: Optional[int] = 1
    token: Optional[str] = None


@router.post("/game/create")
@router.post("/rooms")
async def create_game(req: CreateRoomRequest):
    # Generate 6-char uppercase code (e.g. AIT-7821 or 6-letter alphanumeric)
    room_code = ""
    for _ in range(8):
        candidate = f"AIT-{secrets.token_hex(3).upper()}"
        if await coordinator.get_room(candidate) is None:
            room_code = candidate
            break
    if not room_code:
        raise HTTPException(status_code=503, detail="Could not allocate a room code. Please retry.")

    cap = req.capacity or req.playerCapacity or 8
    if cap < 4 or cap > 8:
        raise HTTPException(status_code=422, detail="Player capacity must be between 4 and 8.")
    is_priv = req.is_private if req.is_private is not None else (req.isPrivate or False)
    room_name = req.room_name or f"{req.host_name}'s Chamber"

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
        name=req.host_name,
        avatar_url="/images/player_somya.png",
        is_host=True,
        is_ready=True,
        slot_index=0,
    )
    engine.add_player(host_player)
    await coordinator.persist_room(engine)

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
            "hostName": req.host_name,
            "playerCapacity": cap,
            "currentPlayers": 1,
            "isPrivate": is_priv,
            "status": "waiting",
        },
    }


@router.post("/game/{room_code}/join")
@router.post("/rooms/{room_code}/join")
async def join_game(room_code: str, req: JoinRoomRequest):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found.")

    if engine.state.phase != GamePhase.LOBBY:
        raise HTTPException(
            status_code=400, detail="Cannot join room: game is already in progress."
        )

    reconnecting_player = req.player_id in engine.state.players
    if reconnecting_player and not verify_player_token(req.token, room_code, req.player_id or ""):
        raise HTTPException(status_code=401, detail="Valid player session required to reconnect.")
    if not reconnecting_player and len(engine.state.players) >= engine.state.capacity:
        raise HTTPException(status_code=400, detail="Room has reached its player capacity.")

    # Generate or reuse player_id
    # A prior ID is only accepted for reconnecting an existing room member.
    player_id = req.player_id if req.player_id in engine.state.players else str(uuid.uuid4())

    # Check if player is already in room
    if player_id in engine.state.players:
        player = engine.state.players[player_id]
        player.is_connected = True
    else:
        player = Player(
            id=player_id,
            name=req.player_name,
            avatar_url=req.avatar_url or "/images/player_pari.png",
            is_host=False,
            is_ready=False,
            slot_index=len(engine.state.players),
        )
        engine.add_player(player)

    await coordinator.persist_room(engine)

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


@router.get("/game/{room_code}/state")
@router.get("/rooms/{room_code}")
async def get_game_state(room_code: str, player_id: Optional[str] = Query(None), token: Optional[str] = Query(None)):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found.")

    viewer = player_id if verify_player_token(token, room_code, player_id or "") else None
    return engine.get_public_state(viewer_id=viewer)


@router.get("/game/{room_code}/my-role")
async def get_my_role(room_code: str, player_id: Optional[str] = Query(None), token: Optional[str] = Query(None)):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found.")
    if not player_id or not verify_player_token(token, room_code, player_id):
        raise HTTPException(status_code=401, detail="Valid player session required.")

    role = "Faithful"
    player_name = "Player"
    if player_id and player_id in engine.state.players:
        p = engine.state.players[player_id]
        role = p.role.value
        player_name = p.name

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

    if not verify_player_token(req.token, room_code, req.player_id):
        raise HTTPException(status_code=401, detail="Valid player session required.")

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


@router.post("/game/{room_code}/start")
async def start_game(
    room_code: str,
    req: Optional[StartGameRequest] = None,
    host_id: Optional[str] = Query(None),
    token: Optional[str] = Query(None),
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
    if not verify_player_token(effective_token, room_code, effective_host_id):
        raise HTTPException(status_code=401, detail="Valid host session required.")

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
    if not verify_player_token(req.token, room_code, req.get_voter_id()):
        raise HTTPException(status_code=401, detail="Valid player session required.")

    success = engine.cast_vote(voter_id=req.get_voter_id(), target_id=req.get_target_id())
    if not success:
        return {"success": False, "message": "Invalid vote or phase closed."}

    await coordinator.persist_room(engine)

    # Broadcast vote count without leaking target
    await manager.broadcast_room(
        room_code,
        {
            "type": "VOTE_CAST",
            "payload": {
                "voterId": req.get_voter_id(),
                "totalVotesCast": len(engine.state.votes),
            },
        },
    )

    # If all eligible living players have cast their votes, advance immediately!
    if engine.are_all_votes_in():
        await coordinator.advance_phase(engine, expected_phase=GamePhase.VOTING, allow_early=True)

    return {"success": True, "message": "Vote recorded."}


@router.post("/game/{room_code}/night-action")
async def submit_night_action(room_code: str, req: NightActionRequest):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found.")
    if not verify_player_token(req.token, room_code, req.get_player_id()):
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
        actor_id=req.get_player_id(),
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
    alive_traitors = [
        p.id
        for p in engine.state.players.values()
        if p.status == PlayerStatus.ALIVE and p.role == Role.TRAITOR
    ]
    actors = {a.actor_id for a in engine.state.night_actions}
    if alive_traitors and set(alive_traitors).issubset(actors):
        # All traitors have submitted kill target -> advance immediately
        await coordinator.advance_phase(engine, expected_phase=GamePhase.NIGHT, allow_early=True)

    return {"success": True, "message": "Night action submitted.",
            "investigationResult": private_result}


@router.post("/game/{room_code}/advance-phase")
async def advance_game_phase(room_code: str):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found.")
    raise HTTPException(status_code=403, detail="Game phases advance automatically on the server.")


@router.get("/game/{room_code}/messages")
async def get_messages(room_code: str):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    if not engine:
        return {"messages": []}
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
            }
            for m in engine.state.chat_history
        ]
    }


@router.post("/game/{room_code}/chat")
async def send_chat_message(room_code: str, req: SendChatRequest):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found.")
    sender_id = req.sender_id or req.senderId or ""
    if not verify_player_token(req.token, room_code, sender_id) or sender_id not in engine.state.players:
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
    await coordinator.persist_room(engine)

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
    }

    await manager.broadcast_room(
        room_code,
        {"type": "DISCUSSION_MESSAGE", "payload": payload},
    )

    return {"success": True, "message": payload}


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
    player_id: Optional[str] = "guest",
    token: Optional[str] = None,
):
    room_code = room_code.upper()
    engine = await coordinator.get_room(room_code)
    # Only existing players can establish a room socket; otherwise callers
    # could impersonate a member by supplying their ID in the query string.
    if (not engine or not player_id or player_id not in engine.state.players
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

            elif msg_type == "READY_TOGGLE":
                target_id = player_id
                if engine and target_id:
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
                if engine and player_id == engine.state.host_id:
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
