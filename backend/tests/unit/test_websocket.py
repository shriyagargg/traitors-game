import pytest
from starlette.testclient import TestClient
from app.main import app


def test_websocket_connection_and_sync():
    client = TestClient(app)
    created = client.post("/api/v1/game/create", json={"host_name": "Somya"}).json()
    room_code = created["room_code"]
    player_id = created["player_id"]
    token = created["session_token"]

    # Connect WebSocket
    with client.websocket_connect(
        f"/api/v1/ws/game/{room_code}/voting?player_id={player_id}&token={token}"
    ) as websocket:
        # Should receive INITIAL_SYNC on connect
        data = websocket.receive_json()
        assert data["type"] == "INITIAL_SYNC"
        assert data["payload"]["room_code"] == room_code

        # Send ping
        websocket.send_json({"type": "PING"})
        response = websocket.receive_json()
        assert response["type"] == "PONG"

