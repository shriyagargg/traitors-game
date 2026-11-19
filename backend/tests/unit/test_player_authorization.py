import pytest
import uuid
from httpx import ASGITransport, AsyncClient
from app.main import app

async def register(client, username):
    r = await client.post("/api/v1/auth/register", json={"username": username + uuid.uuid4().hex[:5], "email": f"{username.lower()}-{uuid.uuid4().hex[:8]}@example.com", "password": "secure-pass-123"})
    assert r.status_code == 200
    return r.json()["access_token"]


@pytest.mark.asyncio
async def test_room_bound_player_tokens_protect_identity_and_phase_controls():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        account = await register(client, "Host")
        created_response = await client.post("/api/v1/game/create", json={}, headers={"Authorization": f"Bearer {account}"})
        created = created_response.json()
        code = created["room_code"]
        host_id = created["player_id"]
        host_token = created["session_token"]

        joined = (await client.post(f"/api/v1/game/{code}/join", json={}, headers={"Authorization": f"Bearer {await register(client, 'Guest')}"})).json()
        guest_id = joined["player_id"]
        guest_token = joined["session_token"]

        # A caller cannot choose another player's view or read their secret role.
        anonymous_state = await client.get(
            f"/api/v1/game/{code}/state", params={"player_id": host_id}
        )
        assert anonymous_state.status_code == 401
        private_role = await client.get(
            f"/api/v1/game/{code}/my-role", params={"player_id": host_id}
        )
        assert private_role.status_code == 401

        own_role = await client.get(
            f"/api/v1/game/{code}/my-role",
            params={"player_id": host_id, "token": host_token, "account_token": account},
        )
        assert own_role.status_code == 200

        impersonation = await client.post(
            f"/api/v1/game/{code}/ready",
            json={"player_id": guest_id, "token": host_token, "account_token": account},
        )
        assert impersonation.status_code == 401

        manual_advance = await client.post(f"/api/v1/game/{code}/advance-phase")
        assert manual_advance.status_code == 403

        # A credential for one room is not accepted in another room.
        other_user = await register(client, "Other")
        other = (await client.post("/api/v1/game/create", json={}, headers={"Authorization": f"Bearer {other_user}"})).json()
        wrong_room = await client.get(
            f"/api/v1/game/{other['room_code']}/my-role",
            params={"player_id": host_id, "token": host_token, "account_token": account},
        )
        assert wrong_room.status_code == 401
