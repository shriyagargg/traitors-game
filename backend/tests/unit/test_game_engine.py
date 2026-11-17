import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.game_engine.engine import GameEngine
from app.game_engine.models import (
    Player,
    PlayerStatus,
    Role,
    GamePhase,
    GameOutcome,
    NightActionType,
)


def test_game_engine_role_assignment():
    engine = GameEngine("TEST01")
    for i in range(8):
        engine.add_player(Player(id=f"p_{i}", name=f"Player_{i}"))

    engine.assign_roles(num_traitors=2, num_detectives=1, num_doctors=1)

    roles = [p.role for p in engine.state.players.values()]
    assert roles.count(Role.TRAITOR) == 2
    assert roles.count(Role.DETECTIVE) == 1
    assert roles.count(Role.DOCTOR) == 1
    assert roles.count(Role.FAITHFUL) == 4


def test_zero_role_leakage():
    engine = GameEngine("TEST02")
    engine.add_player(Player(id="p_viewer", name="Viewer", role=Role.DETECTIVE))
    engine.add_player(Player(id="p_traitor", name="Secret Traitor", role=Role.TRAITOR))
    engine.add_player(Player(id="p_faithful", name="Secret Faithful", role=Role.FAITHFUL))

    # Public state for viewer
    public_state = engine.get_public_state(viewer_id="p_viewer")
    players = {p["id"]: p for p in public_state["players"]}

    # Viewer sees their own role
    assert players["p_viewer"]["role"] == "Detective"
    # Viewer CANNOT see other players' roles
    assert players["p_traitor"]["role"] == "Unknown"
    assert players["p_faithful"]["role"] == "Unknown"


def test_voting_and_banishment():
    engine = GameEngine("TEST03")
    engine.add_player(Player(id="p_1", name="Player 1"))
    engine.add_player(Player(id="p_2", name="Player 2", role=Role.TRAITOR))
    engine.add_player(Player(id="p_3", name="Player 3"))
    engine.add_player(Player(id="p_4", name="Player 4"))

    engine.advance_to_voting()
    assert engine.state.phase == GamePhase.VOTING

    # 3 votes for Player 2
    engine.cast_vote(voter_id="p_1", target_id="p_2")
    engine.cast_vote(voter_id="p_3", target_id="p_2")
    engine.cast_vote(voter_id="p_4", target_id="p_2")
    # 1 vote for Player 1
    engine.cast_vote(voter_id="p_2", target_id="p_1")

    banished, tallies = engine.tally_votes()
    assert banished is not None
    assert banished.id == "p_2"
    assert banished.status == PlayerStatus.BANISHED
    assert tallies[0].target_id == "p_2"
    assert tallies[0].votes_count == 3


def test_night_doctor_save():
    engine = GameEngine("TEST04")
    engine.add_player(Player(id="traitor_1", name="Traitor", role=Role.TRAITOR))
    engine.add_player(Player(id="doctor_1", name="Doctor", role=Role.DOCTOR))
    engine.add_player(Player(id="victim_1", name="Victim", role=Role.FAITHFUL))

    engine.advance_to_night()

    # Traitor attempts murder
    engine.record_night_action(
        actor_id="traitor_1", action_type=NightActionType.KILL, target_id="victim_1"
    )
    # Doctor successfully saves victim
    engine.record_night_action(
        actor_id="doctor_1", action_type=NightActionType.SAVE, target_id="victim_1"
    )

    murdered = engine.resolve_night()
    assert murdered is None
    assert engine.state.players["victim_1"].status == PlayerStatus.ALIVE


def test_night_murder_success():
    engine = GameEngine("TEST05")
    engine.add_player(Player(id="traitor_1", name="Traitor", role=Role.TRAITOR))
    engine.add_player(Player(id="doctor_1", name="Doctor", role=Role.DOCTOR))
    engine.add_player(Player(id="victim_1", name="Victim", role=Role.FAITHFUL))
    engine.add_player(Player(id="other_1", name="Other", role=Role.FAITHFUL))

    engine.advance_to_night()

    # Traitor kills victim_1, Doctor saves other_1
    engine.record_night_action(
        actor_id="traitor_1", action_type=NightActionType.KILL, target_id="victim_1"
    )
    engine.record_night_action(
        actor_id="doctor_1", action_type=NightActionType.SAVE, target_id="other_1"
    )

    murdered = engine.resolve_night()
    assert murdered is not None
    assert murdered.id == "victim_1"
    assert engine.state.players["victim_1"].status == PlayerStatus.MURDERED


def test_faithful_victory_condition():
    engine = GameEngine("TEST06")
    engine.add_player(Player(id="p_t", name="Traitor", role=Role.TRAITOR))
    engine.add_player(Player(id="p_f1", name="Faithful 1", role=Role.FAITHFUL))
    engine.add_player(Player(id="p_f2", name="Faithful 2", role=Role.FAITHFUL))

    assert engine.check_win_condition() == GameOutcome.ONGOING

    # Banish the only traitor
    engine.state.players["p_t"].status = PlayerStatus.BANISHED
    assert engine.check_win_condition() == GameOutcome.FAITHFUL_VICTORY


def test_traitor_victory_condition():
    engine = GameEngine("TEST07")
    engine.add_player(Player(id="p_t", name="Traitor", role=Role.TRAITOR))
    engine.add_player(Player(id="p_f1", name="Faithful 1", role=Role.FAITHFUL))
    engine.add_player(Player(id="p_f2", name="Faithful 2", role=Role.FAITHFUL))

    # Murder one faithful so Traitors (1) == Faithful (1)
    engine.state.players["p_f2"].status = PlayerStatus.MURDERED
    assert engine.check_win_condition() == GameOutcome.TRAITOR_VICTORY


@pytest.mark.asyncio
async def test_rest_api_game_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create Room
        res = await client.post("/api/v1/game/create", json={"host_name": "Somya"})
        assert res.status_code == 200
        room_data = res.json()
        code = room_data["room_code"]
        host_id = room_data["host_id"]
        host_token = room_data["session_token"]

        # 2. Join 3 more players
        joined = []
        for name in ["Shubh", "Pari", "Arnav"]:
            join_res = await client.post(
                f"/api/v1/game/{code}/join", json={"player_name": name}
            )
            assert join_res.status_code == 200
            joined.append(join_res.json())
            await client.post(f"/api/v1/game/{code}/ready", json={
                "player_id": join_res.json()["player_id"],
                "token": join_res.json()["session_token"],
            })

        # 3. Start Game
        start_res = await client.post(f"/api/v1/game/{code}/start", params={
            "host_id": host_id, "token": host_token,
        })
        assert start_res.status_code == 200
        assert start_res.json()["status"] == "started"

        # 4. Check State with Zero Leakage
        state_res = await client.get(
            f"/api/v1/game/{code}/state", params={"player_id": host_id, "token": host_token}
        )
        assert state_res.status_code == 200
        st = state_res.json()
        assert st["phase"] == "ROLE_REVEAL"
        # Host sees their role, not others
        p_host = next(p for p in st["players"] if p["id"] == host_id)
        p_guest = next(p for p in st["players"] if p["id"] == joined[0]["player_id"])
        assert p_host["role"] != "Unknown"
        assert p_guest["role"] == "Unknown"

