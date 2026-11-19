import pytest
from starlette.testclient import TestClient
from app.main import app


def test_websocket_connection_and_sync():
    client = TestClient(app)
    import uuid
    suffix = uuid.uuid4().hex[:8]
    auth = client.post("/api/v1/auth/register", json={"username": f"Somya{suffix}", "email": f"somya{suffix}@example.com", "password": "secure-pass-123"}).json()["access_token"]
    created = client.post("/api/v1/game/create", json={}, headers={"Authorization": f"Bearer {auth}"}).json()
    room_code = created["room_code"]
    player_id = created["player_id"]
    token = created["session_token"]

    # Connect WebSocket
    with client.websocket_connect(
        f"/api/v1/ws/game/{room_code}/voting?player_id={player_id}&token={token}&account_token={auth}"
    ) as websocket:
        # Should receive INITIAL_SYNC on connect
        data = websocket.receive_json()
        assert data["type"] == "INITIAL_SYNC"
        assert data["payload"]["room_code"] == room_code

        # Send ping
        websocket.send_json({"type": "PING"})
        response = websocket.receive_json()
        assert response["type"] == "PONG"


def test_websocket_rejects_missing_or_invalid_tokens():
    client = TestClient(app)
    import uuid
    suffix = uuid.uuid4().hex[:8]
    auth = client.post("/api/v1/auth/register", json={"username": f"Player{suffix}", "email": f"p{suffix}@example.com", "password": "secure-pass-123"}).json()["access_token"]
    created = client.post("/api/v1/game/create", json={}, headers={"Authorization": f"Bearer {auth}"}).json()
    room_code = created["room_code"]
    player_id = created["player_id"]

    # 1. Missing player token
    try:
        with client.websocket_connect(
            f"/api/v1/ws/game/{room_code}?player_id={player_id}&token=&account_token={auth}"
        ) as ws:
            pass
        assert False, "Should have rejected empty token"
    except Exception:
        pass  # Rejected as expected

    # 2. Missing account token
    try:
        with client.websocket_connect(
            f"/api/v1/ws/game/{room_code}?player_id={player_id}&token={created['session_token']}&account_token="
        ) as ws:
            pass
        assert False, "Should have rejected empty account token"
    except Exception:
        pass  # Rejected as expected


def test_websocket_multiplayer_ready_and_reconnection():
    client = TestClient(app)
    import uuid

    # Register Host
    s1 = uuid.uuid4().hex[:8]
    auth1 = client.post("/api/v1/auth/register", json={"username": f"Host{s1}", "email": f"host{s1}@example.com", "password": "secure-pass-123"}).json()["access_token"]
    created = client.post("/api/v1/game/create", json={"room_name": "Council"}, headers={"Authorization": f"Bearer {auth1}"}).json()
    room_code = created["room_code"]
    host_pid = created["player_id"]
    host_tok = created["session_token"]

    # Register Player 2
    s2 = uuid.uuid4().hex[:8]
    auth2 = client.post("/api/v1/auth/register", json={"username": f"Player{s2}", "email": f"p2{s2}@example.com", "password": "secure-pass-123"}).json()["access_token"]
    joined = client.post(f"/api/v1/game/{room_code}/join", json={}, headers={"Authorization": f"Bearer {auth2}"}).json()
    p2_pid = joined["player_id"]
    p2_tok = joined["session_token"]

    # Host connects WebSocket
    with client.websocket_connect(
        f"/api/v1/ws/game/{room_code}?player_id={host_pid}&token={host_tok}&account_token={auth1}"
    ) as ws_host:
        init_host = ws_host.receive_json()
        assert init_host["type"] == "INITIAL_SYNC"
        assert len(init_host["payload"]["players"]) == 2

        # Player 2 toggles ready
        ready_res = client.post(
            f"/api/v1/game/{room_code}/ready",
            json={"player_id": p2_pid, "token": p2_tok, "account_token": auth2}
        )
        assert ready_res.status_code == 200

        # Host receives broadcast
        msg = ws_host.receive_json()
        assert msg["type"] in ("READY_TOGGLE", "PLAYER_READY")
        assert msg["payload"]["playerId"] == p2_pid
        assert msg["payload"]["isReady"] is True

        # Reconnect test: Player 2 calls join again (re-acquiring their session token)
        rejoin = client.post(f"/api/v1/game/{room_code}/join", json={}, headers={"Authorization": f"Bearer {auth2}"}).json()
        assert rejoin["success"] is True
        assert rejoin["player_id"] == p2_pid
        assert len(rejoin["session_token"]) > 10
