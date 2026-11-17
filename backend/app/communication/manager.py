import json
import logging
from typing import Dict, Set, Optional, List
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # room_code -> set of WebSocket instances
        self.active_rooms: Dict[str, Set[WebSocket]] = {}
        self.socket_to_player: Dict[WebSocket, str] = {}
        self.socket_to_room: Dict[WebSocket, str] = {}

    async def connect(self, room_code: str, player_id: str, websocket: WebSocket):
        await websocket.accept()
        room_code = room_code.upper()
        if room_code not in self.active_rooms:
            self.active_rooms[room_code] = set()
        self.active_rooms[room_code].add(websocket)
        self.socket_to_player[websocket] = player_id
        self.socket_to_room[websocket] = room_code

    def disconnect(self, websocket: WebSocket) -> Optional[tuple[str, str]]:
        """Removes the socket and returns (room_code, player_id) if found."""
        room_code = self.socket_to_room.get(websocket)
        player_id = self.socket_to_player.get(websocket)

        if room_code and room_code in self.active_rooms:
            self.active_rooms[room_code].discard(websocket)
            if len(self.active_rooms[room_code]) == 0:
                del self.active_rooms[room_code]

        if websocket in self.socket_to_player:
            del self.socket_to_player[websocket]
        if websocket in self.socket_to_room:
            del self.socket_to_room[websocket]

        if room_code and player_id:
            return room_code, player_id
        return None

    def get_connected_player_ids(self, room_code: str) -> Set[str]:
        room_code = room_code.upper()
        sockets = self.active_rooms.get(room_code, set())
        return {
            self.socket_to_player[ws]
            for ws in sockets
            if ws in self.socket_to_player
        }

    async def send_personal(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception:
            pass

    async def broadcast_room(self, room_code: str, message: dict):
        room_code = room_code.upper()
        sockets = self.active_rooms.get(room_code, set())
        dead_sockets: List[WebSocket] = []

        payload = json.dumps(message)
        for ws in list(sockets):
            try:
                await ws.send_text(payload)
            except Exception:
                dead_sockets.append(ws)

        for ws in dead_sockets:
            self.disconnect(ws)


manager = ConnectionManager()
