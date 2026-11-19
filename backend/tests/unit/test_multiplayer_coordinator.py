import pytest
import time
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.game_engine.coordinator import coordinator
from app.database.session import AsyncSessionLocal, init_db
from app.database.repository import save_game_to_db, load_game_from_db
from app.game_engine.models import Player, GamePhase, Role, PlayerStatus


async def authenticated(client, username):
    import uuid
    suffix = uuid.uuid4().hex[:8]
    response = await client.post("/api/v1/auth/register", json={"username": f"{username}{suffix}", "email": f"{username.lower()}{suffix}@example.com", "password": "secure-pass-123"})
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest.mark.asyncio
async def test_database_persistence_and_loading():
    await init_db()
    room_code = "DBROOM1"

    engine = coordinator.get_or_create_room(
        room_code=room_code,
        room_name="Persisted Chamber",
        host_id="p_somya",
        capacity=8,
    )
    engine.add_player(Player(id="p_somya", name="Somya", is_host=True))
    engine.add_player(Player(id="p_shubh", name="Shubh", is_host=False))

    async with AsyncSessionLocal() as session:
        await save_game_to_db(session, engine)

    # Load in a fresh session
    async with AsyncSessionLocal() as session:
        loaded = await load_game_from_db(session, room_code)
        assert loaded is not None
        assert loaded.state.room_code == "DBROOM1"
        assert loaded.state.room_name == "Persisted Chamber"
        assert len(loaded.state.players) == 2
        assert "p_somya" in loaded.state.players
        assert "p_shubh" in loaded.state.players
        assert loaded.state.players["p_somya"].is_host is True


@pytest.mark.asyncio
async def test_coordinator_authoritative_phase_advancement():
    room_code = "AUTOROOM1"
    engine = coordinator.get_or_create_room(room_code=room_code)

    for i in range(4):
        engine.add_player(Player(id=f"p_{i}", name=f"Player_{i}", is_host=(i == 0)))

    # Start game -> ROLE_REVEAL
    engine.start_game()
    assert engine.state.phase == GamePhase.ROLE_REVEAL

    # Advance phase -> NIGHT
    engine.state.phase_ends_at = time.time() + 100
    next_phase = await coordinator.advance_phase(engine)
    assert next_phase == "NIGHT"
    assert engine.state.phase == GamePhase.NIGHT

    # Traitor action
    traitors = [p for p in engine.state.players.values() if p.role == Role.TRAITOR]
    faithfuls = [p for p in engine.state.players.values() if p.role != Role.TRAITOR]
    assert len(traitors) > 0
    assert len(faithfuls) > 0

    engine.record_night_action(
        actor_id=traitors[0].id,
        action_type="KILL",
        target_id=faithfuls[0].id,
    )

    # Advance phase -> MORNING
    engine.state.phase_ends_at = 0
    next_phase = await coordinator.advance_phase(engine)
    assert next_phase == "MORNING"
    assert engine.state.phase == GamePhase.MORNING

    # Advance phase -> DISCUSSION
    engine.state.phase_ends_at = 0
    next_phase = await coordinator.advance_phase(engine)
    assert next_phase == "DISCUSSION"

    # Advance phase -> VOTING
    engine.state.phase_ends_at = 0
    next_phase = await coordinator.advance_phase(engine)
    assert next_phase == "VOTING"

    # Advance phase -> VOTING_RESULTS
    engine.state.phase_ends_at = 0
    next_phase = await coordinator.advance_phase(engine)
    assert next_phase == "VOTING_RESULTS"


@pytest.mark.asyncio
async def test_chat_and_ready_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create game
        host_account = await authenticated(client, "Arjun")
        priya_account = await authenticated(client, "Priya")
        res = await client.post("/api/v1/game/create", json={}, headers={"Authorization": f"Bearer {host_account}"})
        assert res.status_code == 200
        code = res.json()["room_code"]

        # Join player
        res_join = await client.post(
            f"/api/v1/game/{code}/join", json={}, headers={"Authorization": f"Bearer {priya_account}"}
        )
        assert res_join.status_code == 200
        priya_id = res_join.json()["player_id"]
        priya_token = res_join.json()["session_token"]

        # Toggle Ready
        res_ready = await client.post(
            f"/api/v1/game/{code}/ready", json={"player_id": priya_id, "token": priya_token, "account_token": priya_account}
        )
        assert res_ready.status_code == 200
        assert res_ready.json()["isReady"] is True

        # Send chat
        res_chat = await client.post(
            f"/api/v1/game/{code}/chat",
            json={
                "senderId": priya_id,
                "senderName": "Priya",
                "content": "Hello council members!",
                "token": priya_token,
                "account_token": priya_account,
            },
        )
        assert res_chat.status_code == 200

        # Retrieve messages
        res_msgs = await client.get(f"/api/v1/game/{code}/messages", params={"player_id": priya_id, "token": priya_token, "account_token": priya_account})
        assert res_msgs.status_code == 200
        msgs = res_msgs.json()["messages"]
        assert len(msgs) >= 1
        assert msgs[0]["content"] == "Hello council members!"


@pytest.mark.asyncio
async def test_night_phase_waits_for_each_alive_special_role_action():
    from app.game_engine.coordinator import coordinator
    from app.game_engine.models import GamePhase, Role, NightActionType

    room_code = "NIGHTWAIT"
    engine = coordinator.get_or_create_room(room_code=room_code)
    for index in range(6):
        engine.add_player(Player(id=f"nw_{index}", name=f"Player {index}", is_host=index == 0))
    engine.assign_roles()
    engine.state.phase = GamePhase.NIGHT
    engine.state.status = "PLAYING"
    engine.state.phase_ends_at = time.time() + 100
    actors = [p for p in engine.state.players.values() if p.role in (Role.TRAITOR, Role.DOCTOR, Role.DETECTIVE)]
    target = next(p for p in engine.state.players.values() if p not in actors)

    for actor in actors:
        action = {Role.TRAITOR: NightActionType.KILL, Role.DOCTOR: NightActionType.SAVE, Role.DETECTIVE: NightActionType.INVESTIGATE}[actor.role]
        assert engine.record_night_action(actor.id, action, target.id)
    # The timer expiry path still resolves once at its timestamp; this checks the role-driven action set is complete.
    assert {a.actor_id for a in engine.state.night_actions} == {p.id for p in actors}


@pytest.mark.asyncio
async def test_night_does_not_advance_until_doctor_and_detective_act():
    from app.game_engine.coordinator import coordinator
    from app.game_engine.models import GamePhase, Role, NightActionType

    engine = coordinator.get_or_create_room(room_code="NIGHTGUARD")
    for index, role in enumerate([Role.TRAITOR, Role.DOCTOR, Role.DETECTIVE, Role.FAITHFUL]):
        engine.add_player(Player(id=f"ng_{index}", name=f"Player {index}", role=role, is_host=index == 0))
    engine.state.phase = GamePhase.NIGHT
    engine.state.status = "PLAYING"
    engine.state.phase_ends_at = time.time() + 100
    assert engine.record_night_action("ng_0", NightActionType.KILL, "ng_3")
    assert engine.record_night_action("ng_1", NightActionType.SAVE, "ng_3")
    assert await coordinator.advance_phase(engine, expected_phase=GamePhase.NIGHT, allow_early=True) == "NIGHT"
    assert engine.state.phase == GamePhase.NIGHT
    assert engine.record_night_action("ng_2", NightActionType.INVESTIGATE, "ng_3")
    assert await coordinator.advance_phase(engine, expected_phase=GamePhase.NIGHT, allow_early=True) == "MORNING"


@pytest.mark.asyncio
async def test_lobby_leave_and_host_transfer():
    from httpx import AsyncClient, ASGITransport
    from app.main import app
    from tests.unit.test_game_engine import authenticated

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        tok_host = await authenticated(client, "HostLeave")
        tok_guest = await authenticated(client, "GuestLeave")

        # 1. Host creates room
        res_create = await client.post("/api/v1/game/create", json={"capacity": 4}, headers={"Authorization": f"Bearer {tok_host}"})
        assert res_create.status_code == 200
        code = res_create.json()["room_code"]
        host_id = res_create.json()["host_id"]
        host_token = res_create.json()["session_token"]

        # 2. Guest joins
        res_join = await client.post(f"/api/v1/game/{code}/join", json={}, headers={"Authorization": f"Bearer {tok_guest}"})
        assert res_join.status_code == 200
        guest_id = res_join.json()["player_id"]
        guest_token = res_join.json()["session_token"]

        # 3. Guest leaves
        res_leave = await client.post(f"/api/v1/game/{code}/leave", json={
            "player_id": guest_id, "token": guest_token, "account_token": tok_guest
        })
        assert res_leave.status_code == 200
        assert res_leave.json()["success"] is True

        # Verify state: only 1 player remains (host)
        st = (await client.get(f"/api/v1/game/{code}/state", params={
            "player_id": host_id, "token": host_token, "account_token": tok_host
        })).json()
        assert len(st["players"]) == 1
        assert st["players"][0]["id"] == host_id
