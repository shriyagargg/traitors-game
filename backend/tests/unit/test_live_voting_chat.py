import time
import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.communication.manager import manager
from app.game_engine.coordinator import coordinator
from app.game_engine.models import GamePhase, PlayerStatus
from app.main import app


async def register(client, label):
    suffix = uuid.uuid4().hex[:8]
    response = await client.post("/api/v1/auth/register", json={
        "username": f"{label}{suffix}",
        "email": f"{label.lower()}{suffix}@example.com",
        "password": "secure-pass-123",
    })
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


class FakeSocket:
    def __init__(self):
        self.messages = []

    async def send_text(self, message):
        self.messages.append(message)


@pytest.mark.asyncio
async def test_chat_is_room_scoped_broadcast_and_persisted():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        account = await register(client, "Chat")
        created = await client.post("/api/v1/game/create", json={}, headers={"Authorization": f"Bearer {account}"})
        assert created.status_code == 200
        room = created.json()["room_code"]
        player_id = created.json()["player_id"]
        token = created.json()["session_token"]
        other_account = await register(client, "ChatPeer")
        other_player = await client.post(f"/api/v1/game/{room}/join", json={}, headers={"Authorization": f"Bearer {other_account}"})
        assert other_player.status_code == 200

        room_socket, peer_socket, other_socket = FakeSocket(), FakeSocket(), FakeSocket()
        manager.active_rooms.setdefault(room, set()).update((room_socket, peer_socket))
        manager.active_rooms.setdefault("OTHERROOM", set()).add(other_socket)
        try:
            response = await client.post(f"/api/v1/game/{room}/chat", json={
                "senderId": player_id, "content": "Live from this room", "token": token,
                "account_token": account,
            })
            assert response.status_code == 200, response.text
            assert response.json()["message"]["senderName"]
            assert room_socket.messages
            assert peer_socket.messages == room_socket.messages
            assert not other_socket.messages

            history = await client.get(f"/api/v1/game/{room}/messages", params={
                "player_id": other_player.json()["player_id"],
                "token": other_player.json()["session_token"], "account_token": other_account,
            })
            assert history.status_code == 200
            assert any(m["content"] == "Live from this room" for m in history.json()["messages"])
        finally:
            manager.active_rooms.get(room, set()).discard(room_socket)
            manager.active_rooms.get(room, set()).discard(peer_socket)
            manager.active_rooms.get("OTHERROOM", set()).discard(other_socket)


@pytest.mark.asyncio
async def test_vote_endpoint_saves_votes_and_rejects_duplicate_dead_and_expired_votes():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        accounts = [await register(client, f"Vote{i}") for i in range(4)]
        created = await client.post("/api/v1/game/create", json={}, headers={"Authorization": f"Bearer {accounts[0]}"})
        assert created.status_code == 200, created.text
        room = created.json()["room_code"]
        members = [{"id": created.json()["player_id"], "token": created.json()["session_token"], "account": accounts[0]}]
        for account in accounts[1:]:
            joined = await client.post(f"/api/v1/game/{room}/join", json={}, headers={"Authorization": f"Bearer {account}"})
            assert joined.status_code == 200, joined.text
            members.append({"id": joined.json()["player_id"], "token": joined.json()["session_token"], "account": account})

        engine = await coordinator.get_room(room)
        engine.assign_roles()
        engine.state.phase = GamePhase.VOTING
        engine.state.status = "PLAYING"
        engine.state.round_number = 1
        engine.state.phase_ends_at = time.time() + 90
        engine.state.votes = []

        voter, target, eliminated, other = members
        engine.state.players[eliminated["id"]].status = PlayerStatus.BANISHED
        body = {"playerId": voter["id"], "targetId": target["id"], "roundNumber": 1,
                "token": voter["token"], "account_token": voter["account"]}
        accepted = await client.post(f"/api/v1/game/{room}/vote", json=body)
        assert accepted.status_code == 200, accepted.text
        state = await client.get(f"/api/v1/game/{room}/state", params={
            "player_id": voter["id"], "token": voter["token"], "account_token": voter["account"],
        })
        assert state.json()["total_votes_cast"] == 1

        duplicate = await client.post(f"/api/v1/game/{room}/vote", json=body)
        assert duplicate.status_code == 409
        dead_vote = await client.post(f"/api/v1/game/{room}/vote", json={
            "playerId": eliminated["id"], "targetId": target["id"], "roundNumber": 1,
            "token": eliminated["token"], "account_token": eliminated["account"],
        })
        assert dead_vote.status_code == 409

        engine.state.phase_ends_at = time.time() - 1
        late_vote = await client.post(f"/api/v1/game/{room}/vote", json={
            "playerId": other["id"], "targetId": target["id"], "roundNumber": 1,
            "token": other["token"], "account_token": other["account"],
        })
        assert late_vote.status_code == 409

        # An expired timestamp is advanced by the same server coordinator used
        # by the timer worker, even if one living player never voted.
        assert await coordinator.advance_phase(engine, expected_phase=GamePhase.VOTING) == "VOTING_RESULTS"


@pytest.mark.asyncio
async def test_architect_chat_uses_provider_and_returns_real_endpoint_answer(monkeypatch):
    from app.ai_engine import agents
    from app.core.config import settings

    class ProviderResponse:
        status_code = 200
        is_success = True

        @staticmethod
        def json():
            return {"candidates": [{"content": {"parts": [{"text": "Watch how the accusation changes after the vote."}]}}]}

    class ProviderClient:
        def __init__(self, **kwargs):
            self.timeout = kwargs["timeout"]

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def post(self, url, *, headers, json):
            assert "/models/" + settings.GEMINI_MODEL + ":generateContent" in url
            assert headers["x-goog-api-key"] == "unit-test-key"
            assert "secret role" in json["systemInstruction"]["parts"][0]["text"]
            return ProviderResponse()

    monkeypatch.setattr(settings, "LLM_PROVIDER", "gemini")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "unit-test-key")
    monkeypatch.setattr(agents.architect.httpx, "AsyncClient", ProviderClient)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        account = await register(client, "Architect")
        created = await client.post("/api/v1/game/create", json={}, headers={"Authorization": f"Bearer {account}"})
        room = created.json()["room_code"]
        player_id = created.json()["player_id"]
        token = created.json()["session_token"]
        engine = await coordinator.get_room(room)
        engine.state.phase = GamePhase.DISCUSSION

        result = await client.post(f"/api/v1/game/{room}/architect-chat", json={
            "player_id": player_id, "token": token, "account_token": account,
            "message": "What should I watch for?",
        })
        assert result.status_code == 200, result.text
        assert result.json()["answer"] == "Watch how the accusation changes after the vote."


@pytest.mark.asyncio
async def test_architect_chat_returns_clear_unconfigured_provider_error(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "LLM_PROVIDER", "gemini")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        account = await register(client, "NoKey")
        created = await client.post("/api/v1/game/create", json={}, headers={"Authorization": f"Bearer {account}"})
        room = created.json()["room_code"]
        engine = await coordinator.get_room(room)
        engine.state.phase = GamePhase.DISCUSSION
        response = await client.post(f"/api/v1/game/{room}/architect-chat", json={
            "player_id": created.json()["player_id"],
            "token": created.json()["session_token"],
            "account_token": account,
            "message": "What should I watch for?",
        })
        assert response.status_code == 503
        assert "GEMINI_API_KEY" in response.json()["detail"]
