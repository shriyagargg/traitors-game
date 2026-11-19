import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.game_engine.coordinator import coordinator
from app.game_engine.engine import GameEngine
from app.game_engine.models import GamePhase, NightActionType, Player, Role
from app.main import app


async def register(client, prefix):
    suffix = uuid.uuid4().hex[:8]
    response = await client.post("/api/v1/auth/register", json={
        "username": f"{prefix}{suffix}",
        "email": f"{prefix.lower()}{suffix}@example.com",
        "password": "secure-pass-123",
    })
    assert response.status_code == 200, response.text
    return response.json()


@pytest.mark.asyncio
async def test_host_can_add_remove_test_players_without_account_identity():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        host = await register(client, "BotHost")
        other = await register(client, "OtherHost")
        created = await client.post("/api/v1/game/create", json={"capacity": 6}, headers={
            "Authorization": f"Bearer {host['access_token']}"
        })
        assert created.status_code == 200, created.text
        room = created.json()
        code = room["room_code"]
        bad_owner = await client.post(f"/api/v1/game/{code}/test-players", json={}, headers={
            "Authorization": f"Bearer {other['access_token']}"
        })
        assert bad_owner.status_code == 403

        added = await client.post(f"/api/v1/game/{code}/test-players", json={"count": 2}, headers={
            "Authorization": f"Bearer {host['access_token']}"
        })
        assert added.status_code == 200, added.text
        assert added.json()["added"] == 2
        assert added.json()["playerCount"] == 3

        joined = await client.post(f"/api/v1/game/{code}/join", json={}, headers={
            "Authorization": f"Bearer {other['access_token']}"
        })
        assert joined.status_code == 200, joined.text
        filled = await client.post(f"/api/v1/game/{code}/test-players", json={}, headers={
            "Authorization": f"Bearer {host['access_token']}"
        })
        assert filled.status_code == 200, filled.text
        assert filled.json()["added"] == 2
        assert filled.json()["playerCount"] == 6

        state = await client.get(f"/api/v1/game/{code}/state", params={
            "player_id": room["player_id"], "token": room["session_token"],
            "account_token": host["access_token"],
        })
        players = state.json()["players"]
        bots = [player for player in players if player["is_ai"]]
        assert len(bots) == 4
        assert len({bot["name"] for bot in bots}) == 4
        assert len({bot["avatar_url"] for bot in bots}) == 4
        assert all(bot["is_connected"] is False for bot in bots)

        removed = await client.delete(f"/api/v1/game/{code}/test-players/{bots[0]['id']}", headers={
            "Authorization": f"Bearer {host['access_token']}"
        })
        assert removed.status_code == 200, removed.text
        assert removed.json()["playerCount"] == 5


@pytest.mark.asyncio
async def test_test_bots_take_role_valid_night_actions_and_votes():
    engine = GameEngine("BOTTEST", capacity=6)
    roles = [Role.TRAITOR, Role.DOCTOR, Role.DETECTIVE, Role.FAITHFUL, Role.FAITHFUL, Role.FAITHFUL]
    for index, role in enumerate(roles):
        engine.add_player(Player(id=f"bot_{index}", name=f"Bot {index}", role=role, is_ai=index < 3))
    engine.state.phase = GamePhase.NIGHT
    engine.state.phase_ends_at = 9999999999
    coordinator._simulate_test_player_actions(engine)
    assert {action.action_type for action in engine.state.night_actions} == {
        NightActionType.KILL, NightActionType.SAVE, NightActionType.INVESTIGATE
    }

    engine.advance_to_voting()
    coordinator._simulate_test_player_actions(engine)
    assert len(engine.state.votes) == 3
    assert len({vote.voter_id for vote in engine.state.votes}) == 3
    assert all(engine.state.players[vote.target_id].status.value == "ALIVE" for vote in engine.state.votes)
