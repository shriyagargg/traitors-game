import pytest
from starlette.testclient import TestClient
from app.main import app


def test_websocket_connection_and_sync():
    client = TestClient(app)
    room_code = "WSROOM1"

    # Connect WebSocket
    with client.websocket_connect(f"/api/v1/ws/game/{room_code}/voting?player_id=p_somya") as websocket:
        # Should receive INITIAL_SYNC on connect
        data = websocket.receive_json()
        assert data["type"] == "INITIAL_SYNC"
        assert data["payload"]["room_code"] == room_code

        # Send ping
        websocket.send_json({"type": "PING"})
        response = websocket.receive_json()
        assert response["type"] == "PONG"

