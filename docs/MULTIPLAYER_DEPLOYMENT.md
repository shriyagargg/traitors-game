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

This repository includes `render.yaml` for a persistent FastAPI service and PostgreSQL database. The API should remain a single long-running process because the timer coordinator, phase locks, and room WebSocket manager currently live in process memory. Vercel supports WebSocket functions, but this backend is not yet safe to spread across independently invoked function instances.

1. Push the repository to the GitHub account you will connect to both hosting providers.
2. In Render, create a Blueprint from the repository and review the paid web-service and Postgres plans in `render.yaml`. Set `BACKEND_CORS_ORIGINS` to the exact Vercel origin (for example, `https://your-project.vercel.app`). Set `GEMINI_API_KEY` if you want live Architect AI responses.
3. Wait for Render to deploy. Verify `https://<render-service>/api/v1/health` returns healthy. Copy the service's HTTPS origin and its matching `wss://` origin.
4. In Vercel, import the same repository and set the project Root Directory to `frontend`. Add `NEXT_PUBLIC_API_URL=https://<render-service>` and `NEXT_PUBLIC_WS_URL=wss://<render-service>` before deploying.
5. Verify signup/login, create/join, WebSocket room sync, a chat message, a vote, and phase transitions using two separate browsers on the production domains.

The Render blueprint provisions paid resources; review current plan pricing before confirming it. Hosting credentials and DNS are not present in this repository, so the services still need to be linked and created in the provider dashboards.

## Game rules and phase flow

- A host creates a room with capacity 4–8 and starts only when at least four players are ready. The lobby UI offers 6–8 seats; local test players occupy seats but do not count as registered accounts or public user statistics.
- Roles are randomly assigned at start: 1 Traitor for 4–5 players, 2 for 6 or more, plus a Doctor and Detective when those slots are available; remaining players are Faithful.
- The timed phases run Role Reveal → Night → Morning → Discussion → Voting → Results. Unless the game ends, Results advances to the next Night and round. The backend stores each phase's end timestamp and performs timed transitions.
- At Night, living Traitors choose an elimination, the Doctor chooses a player to protect, and the Detective investigates a player. A protected target survives; otherwise the chosen target is murdered. Each role's action is validated by the server.
- During Discussion, living players can chat. During Voting, each eligible living player may cast one confidential vote for another living player. The player with the most valid votes is banished; a tie means no one is banished.
- Faithful win when no Traitors remain. Traitors win when they equal or outnumber the living Faithful, or when at most two players remain with a Traitor alive. The final outcome is shown after results.

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
