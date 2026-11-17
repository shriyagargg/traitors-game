import pytest
import time
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.game_engine.coordinator import coordinator
from app.database.session import AsyncSessionLocal, init_db
from app.database.repository import save_game_to_db, load_game_from_db
from app.game_engine.models import Player, GamePhase, Role, PlayerStatus


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
    engine.state.phase_ends_at = 0
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
        res = await client.post("/api/v1/game/create", json={"host_name": "Arjun"})
        assert res.status_code == 200
        code = res.json()["room_code"]

        # Join player
        res_join = await client.post(
            f"/api/v1/game/{code}/join", json={"player_name": "Priya"}
        )
        assert res_join.status_code == 200
        priya_id = res_join.json()["player_id"]
        priya_token = res_join.json()["session_token"]

        # Toggle Ready
        res_ready = await client.post(
            f"/api/v1/game/{code}/ready", json={"player_id": priya_id, "token": priya_token}
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
            },
        )
        assert res_chat.status_code == 200

        # Retrieve messages
        res_msgs = await client.get(f"/api/v1/game/{code}/messages")
        assert res_msgs.status_code == 200
        msgs = res_msgs.json()["messages"]
        assert len(msgs) >= 1
        assert msgs[0]["content"] == "Hello council members!"
