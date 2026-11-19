import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.ai_engine.agents.architect import architect_agent


async def authenticated(client, username):
    import uuid
    suffix = uuid.uuid4().hex[:8]
    response = await client.post("/api/v1/auth/register", json={"username": f"{username}{suffix}", "email": f"{username.lower()}{suffix}@example.com", "password": "secure-pass-123"})
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest.mark.asyncio
async def test_architect_morning_announcements():
    # 1. Victim eliminated
    msg_victim = await architect_agent.generate_morning_announcement(
        round_number=2, victim_name="Arnav", was_saved=False, alive_count=6
    )
    assert "Arnav" in msg_victim
    assert len(msg_victim) > 20

    # 2. Doctor saved
    msg_saved = await architect_agent.generate_morning_announcement(
        round_number=2, victim_name=None, was_saved=True, alive_count=7
    )
    assert len(msg_saved) > 20


@pytest.mark.asyncio
async def test_architect_banishment_proclamations():
    # 1. Traitor banished
    msg_traitor = await architect_agent.generate_banishment_proclamation(
        round_number=2, banished_name="Shubh", is_traitor=True, vote_count=4
    )
    assert "Shubh" in msg_traitor
    assert "TRAITOR" in msg_traitor

    # 2. Faithful banished
    msg_faithful = await architect_agent.generate_banishment_proclamation(
        round_number=2, banished_name="Pari", is_traitor=False, vote_count=4
    )
    assert "Pari" in msg_faithful
    assert "FAITHFUL" in msg_faithful


@pytest.mark.asyncio
async def test_architect_hint_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create room first
        token = await authenticated(client, "Somya")
        res = await client.post("/api/v1/game/create", json={}, headers={"Authorization": f"Bearer {token}"})
        code = res.json()["room_code"]

        # Request hint
        hint_res = await client.get(f"/api/v1/game/{code}/architect-hint")
        assert hint_res.status_code == 200
        data = hint_res.json()
        assert "hint" in data
        assert data["speaker"] == "The Architect"
        assert len(data["hint"]) > 10

