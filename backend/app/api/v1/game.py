from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Optional, List
import uuid

from app.game_engine.engine import GameEngine
from app.game_engine.models import Player, PlayerStatus, NightActionType
from app.communication.manager import manager
from app.ai_engine.agents.architect import architect_agent

router = APIRouter()

# Global in-memory storage of active games
ACTIVE_ROOMS: Dict[str, GameEngine] = {}


def get_or_create_room(room_code: str) -> GameEngine:
    room_code = room_code.upper()
    if room_code not in ACTIVE_ROOMS:
        ACTIVE_ROOMS[room_code] = GameEngine(room_code=room_code)
    return ACTIVE_ROOMS[room_code]


class CreateRoomRequest(BaseModel):
    host_name: str
    capacity: int = 8


class JoinRoomRequest(BaseModel):
    player_name: str
    avatar_url: Optional[str] = "/images/somya_avatar.png"


class CastVoteRequest(BaseModel):
    playerId: str
    roundNumber: int
    targetId: str


class NightActionRequest(BaseModel):
    playerId: str
    actionType: NightActionType
    targetId: str
    roundNumber: int


@router.post("/game/create")
async def create_game(req: CreateRoomRequest):
    room_code = str(uuid.uuid4())[:6].upper()
    engine = get_or_create_room(room_code)
    host_id = f"p_{req.host_name.lower().replace(' ', '_')}"
    host = Player(
        id=host_id,
        name=req.host_name,
        avatar_url="/images/player_somya.png",
        is_host=True,
    )
    engine.add_player(host)
    return {
        "room_code": room_code,
        "host_id": host.id,
        "message": f"Room {room_code} created successfully.",
    }


@router.post("/game/{room_code}/join")
async def join_game(room_code: str, req: JoinRoomRequest):
    engine = get_or_create_room(room_code)
    player_id = f"p_{req.player_name.lower().replace(' ', '_')}"
    player = Player(
        id=player_id,
        name=req.player_name,
        avatar_url=req.avatar_url or "/images/somya_avatar.png",
        is_host=False,
    )
    success = engine.add_player(player)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot join room (already in progress)")
    return {
        "room_code": room_code.upper(),
        "player_id": player.id,
        "player_name": player.name,
    }


@router.get("/game/{room_code}/state")
async def get_game_state(room_code: str, player_id: Optional[str] = Query(None)):
    engine = get_or_create_room(room_code)
    return engine.get_public_state(viewer_id=player_id)


@router.post("/game/{room_code}/start")
async def start_game(room_code: str):
    engine = get_or_create_room(room_code)
    try:
        engine.start_game()
        await manager.broadcast_room(
            room_code,
            {"type": "GAME_STARTED", "payload": engine.get_public_state()},
        )
        return {"status": "started", "phase": engine.state.phase}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/game/{room_code}/vote")
async def cast_vote(room_code: str, req: CastVoteRequest):
    engine = get_or_create_room(room_code)
    success = engine.cast_vote(voter_id=req.playerId, target_id=req.targetId)
    if not success:
        return {"success": False, "message": "Vote could not be recorded"}

    # Broadcast vote count notification (without revealing target)
    await manager.broadcast_room(
        room_code,
        {
            "type": "VOTE_CAST",
            "payload": {
                "voterId": req.playerId,
                "totalVotesCast": len(engine.state.votes),
            },
        },
    )
    return {"success": True, "message": "Vote recorded successfully"}


@router.post("/game/{room_code}/tally")
async def tally_votes(room_code: str):
    engine = get_or_create_room(room_code)
    banished, tallies = engine.tally_votes()

    proclamation = ""
    if banished:
        is_traitor = banished.role == "Traitor"
        proclamation = await architect_agent.generate_banishment_proclamation(
            round_number=engine.state.round_number,
            banished_name=banished.name,
            is_traitor=is_traitor,
            vote_count=tallies[0].votes_count if tallies else 0,
            total_votes=len(engine.state.votes),
        )

    payload = {
        "banishedPlayer": {
            "id": banished.id if banished else None,
            "name": banished.name if banished else None,
            "role": banished.role.value if banished else None,
            "isTraitor": banished.role == "Traitor" if banished else False,
        } if banished else None,
        "tallies": [t.model_dump() for t in tallies],
        "outcome": engine.state.outcome.value,
        "architectAnnouncement": proclamation,
    }

    await manager.broadcast_room(
        room_code,
        {"type": "VOTING_RESULTS_UPDATE", "payload": payload},
    )
    return payload


@router.post("/game/{room_code}/night-action")
async def submit_night_action(room_code: str, req: NightActionRequest):
    engine = get_or_create_room(room_code)
    success = engine.record_night_action(
        actor_id=req.playerId,
        action_type=req.actionType,
        target_id=req.targetId,
    )
    return {"success": success}


@router.post("/game/{room_code}/resolve-night")
async def resolve_night(room_code: str):
    engine = get_or_create_room(room_code)
    murdered = engine.resolve_night()

    alive_count = len([p for p in engine.state.players.values() if p.status == PlayerStatus.ALIVE])
    announcement = await architect_agent.generate_morning_announcement(
        round_number=engine.state.round_number,
        victim_name=murdered.name if murdered else None,
        was_saved=(murdered is None),
        alive_count=alive_count,
    )

    payload = {
        "murderedPlayer": {
            "id": murdered.id,
            "name": murdered.name,
        } if murdered else None,
        "roundNumber": engine.state.round_number,
        "outcome": engine.state.outcome.value,
        "architectAnnouncement": announcement,
    }

    await manager.broadcast_room(
        room_code,
        {"type": "MORNING_UPDATE", "payload": payload},
    )
    return payload


@router.get("/game/{room_code}/architect-hint")
async def get_architect_hint(room_code: str):
    engine = get_or_create_room(room_code)
    alive_players = [
        p.name for p in engine.state.players.values() if p.status == PlayerStatus.ALIVE
    ]
    hint = await architect_agent.generate_discussion_hint(
        round_number=engine.state.round_number,
        player_names=alive_players,
    )
    return {
        "roundNumber": engine.state.round_number,
        "hint": hint,
        "speaker": "The Architect",
    }


@router.websocket("/ws/game/{room_code}/{phase}")
async def game_websocket_endpoint(
    websocket: WebSocket, room_code: str, phase: str, player_id: Optional[str] = "guest"
):
    await manager.connect(room_code, player_id or "guest", websocket)
    try:
        engine = get_or_create_room(room_code)
        # Send initial sync state upon connection
        await manager.send_personal(
            websocket,
            {
                "type": "INITIAL_SYNC",
                "payload": engine.get_public_state(viewer_id=player_id),
            },
        )

        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            payload = data.get("payload", {})

            if msg_type in ("CHAT_MESSAGE", "DISCUSSION_MESSAGE"):
                msg_payload = (
                    payload
                    if msg_type == "DISCUSSION_MESSAGE"
                    else {
                        "id": f"msg_{uuid.uuid4().hex[:8]}",
                        "senderId": player_id,
                        "senderName": payload.get("senderName", player_id),
                        "avatarUrl": payload.get("avatarUrl", "/images/player_somya.png"),
                        "timestamp": payload.get("timestamp", "Now"),
                        "text": payload.get("content", payload.get("text", "")),
                    }
                )
                await manager.broadcast_room(
                    room_code,
                    {"type": "DISCUSSION_MESSAGE", "payload": msg_payload},
                )
            elif msg_type == "PING":
                await manager.send_personal(websocket, {"type": "PONG"})

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

