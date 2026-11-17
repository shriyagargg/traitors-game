import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_room_bound_player_tokens_protect_identity_and_phase_controls():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        created = (await client.post("/api/v1/game/create", json={"host_name": "Host"})).json()
        code = created["room_code"]
        host_id = created["player_id"]
        host_token = created["session_token"]

        joined = (await client.post(f"/api/v1/game/{code}/join", json={"player_name": "Guest"})).json()
        guest_id = joined["player_id"]
        guest_token = joined["session_token"]

        # A caller cannot choose another player's view or read their secret role.
        anonymous_state = await client.get(
            f"/api/v1/game/{code}/state", params={"player_id": host_id}
        )
        assert all(player["role"] == "Unknown" for player in anonymous_state.json()["players"])
        private_role = await client.get(
            f"/api/v1/game/{code}/my-role", params={"player_id": host_id}
        )
        assert private_role.status_code == 401

        own_role = await client.get(
            f"/api/v1/game/{code}/my-role",
            params={"player_id": host_id, "token": host_token},
        )
        assert own_role.status_code == 200

        impersonation = await client.post(
            f"/api/v1/game/{code}/ready",
            json={"player_id": guest_id, "token": host_token},
        )
        assert impersonation.status_code == 401

        manual_advance = await client.post(f"/api/v1/game/{code}/advance-phase")
        assert manual_advance.status_code == 403

        # A credential for one room is not accepted in another room.
        other = (await client.post("/api/v1/game/create", json={"host_name": "Other"})).json()
        wrong_room = await client.get(
            f"/api/v1/game/{other['room_code']}/my-role",
            params={"player_id": host_id, "token": host_token},
        )
        assert wrong_room.status_code == 401
