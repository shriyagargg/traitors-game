# Multiplayer backend and deployment

## Current architecture

- Next.js 15 frontend in `frontend/`.
- FastAPI REST and WebSocket backend in `backend/app/`.
- SQLAlchemy async persistence; SQLite for local development and PostgreSQL for deployment.
- Room codes, player membership, roles, round state, chat, votes, and night actions are persisted. Phase timestamps are server epoch seconds; the browser only renders the remaining time.
- Anonymous player sessions receive a signed, room-bound 30-day token. The token is returned only by create/join and is stored with the browser's player session.

## Environment

Backend variables are in `backend/.env.example`. Set:

- `SECRET_KEY`: a unique random secret of at least 32 bytes.
- `DATABASE_URL`: `postgresql+psycopg://USER:PASSWORD@HOST:5432/DATABASE` for production.
- `BACKEND_CORS_ORIGINS`: comma-separated exact frontend origins, without `*`.
- Optional Architect provider credentials as needed.

Frontend variables are in `frontend/.env.example`:

- `NEXT_PUBLIC_API_URL`: public HTTPS API origin, e.g. `https://api.example.com`.
- `NEXT_PUBLIC_WS_URL`: matching public WSS origin, e.g. `wss://api.example.com`.

These values are public endpoint URLs, not secrets. Do not put database credentials or signing keys in `NEXT_PUBLIC_*` variables.

## Local run

1. Copy the backend example to `backend/.env`; set a local random `SECRET_KEY`.
2. Run `cd backend && .venv/bin/uvicorn app.main:app --app-dir . --host 0.0.0.0 --port 8000`.
3. Copy the frontend example to `frontend/.env.local` and run `cd frontend && npm run dev`.

## Public deployment

1. Provision a managed PostgreSQL database with persistent backups.
2. Deploy `backend/` to an HTTPS-capable Python host. Use the `backend` directory as the service root and run `uvicorn app.main:app --app-dir . --host 0.0.0.0 --port $PORT`.
3. Set the backend variables above in the hosting provider. Ensure the proxy supports WebSocket upgrades and forwards WSS traffic.
4. Deploy `frontend/` to Vercel or another Next.js host. Set the API and WSS origins at build time.
5. Set the exact deployed frontend origin in `BACKEND_CORS_ORIGINS`; verify `/api/v1/health`, create/join, and a WebSocket connection on the public domains.

The current connection manager and timer coordinator are process-local. Run one backend process/worker per deployment for correct room broadcasts and timers. Horizontal backend scaling requires a shared WebSocket pub/sub adapter and distributed timer/phase lock before adding replicas. Public deployment credentials and DNS are not present in this repository, so no deployment has been performed.

## Current API and real-time contract

REST routes are under `/api/v1` (the same game router is also mounted at root for compatibility):

- `POST /game/create`
- `POST /game/{room_code}/join`
- `GET /game/{room_code}/state?player_id=...&token=...`
- `GET /game/{room_code}/my-role?player_id=...&token=...`
- `POST /game/{room_code}/ready`
- `POST /game/{room_code}/start?host_id=...&token=...`
- `POST /game/{room_code}/vote`
- `POST /game/{room_code}/night-action`
- `GET /game/{room_code}/messages`
- `POST /game/{room_code}/chat`
- `GET /health`

`POST /game/{room_code}/advance-phase` is intentionally rejected; the server timer or completion of all required actions advances the phase.

WebSocket: `/api/v1/ws/game/{room_code}?player_id=...&token=...`. The server sends `INITIAL_SYNC`, then room events including `PLAYER_JOINED`, `PLAYER_RECONNECTED`, `PLAYER_DISCONNECTED`, `READY_TOGGLE`, `GAME_STARTED`, `PHASE_CHANGED`, and `DISCUSSION_MESSAGE`. `PING` receives `PONG`. Secret roles are personalized only in sync/state responses for the credential owner; the eliminated player's role is revealed in voting results, and all roles at game end. Ballot identities are never included in public tallies.

## Persistence tables

`games`, `players`, `votes`, `night_actions`, and `chat_messages`. The schema is declared in `backend/app/database/models.py` and initialized on startup. Existing deployments should use Alembic migrations before relying on schema changes; `create_all` does not alter existing tables.
