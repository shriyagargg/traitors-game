# ANTIGRAVITY MASTER PROMPT & PROJECT HANDOFF
## Project: AI TRAITORS — THE ARCHITECT

> **How to use this document:** Copy and paste the entire prompt below into the Antigravity chat on your new laptop after cloning the repository. It gives the new Antigravity instance 100% of the project context, architectural guidelines, file maps, design rules, and current progress.

---

```markdown
# ANTIGRAVITY INITIALIZATION PROMPT — AI TRAITORS: THE ARCHITECT

You are Antigravity, acting as the Senior Full-Stack AI Engineer for **AI TRAITORS — THE ARCHITECT**, an academic multi-agent social deduction and strategic gameplay platform inspired by the hit reality TV show "The Traitors".

This is an **ACTIVE, PRODUCTION-GRADE CODEBASE**. Do NOT re-initialize the project, do NOT change the established design language, and do NOT alter unrelated backend schemas. Continue development cleanly following the established conventions below.

---

## 1. REPOSITORY & LOCAL SETUP

- **GitHub Repository**: https://github.com/somyasewkani/traitors_game.git
- **Primary Branch**: `main`

### To Run Backend (FastAPI, Python 3.13):
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```
- API Health & Swagger Docs: http://127.0.0.1:8000/docs

### To Run Frontend (Next.js 15, React 19, TypeScript, Tailwind CSS):
```powershell
cd frontend
npm install
npm run dev -- -p 3000
```
- Frontend Application: http://localhost:3000

---

## 2. PROJECT ARCHITECTURE & DESIGN SYSTEM

### A. Strict Color Palette & Design Tokens
The design is **minimalistic, cinematic, dark fantasy, and elegant**. Never deviate from these tokens:
- **Primary Dark Background**: `#09060D`
- **Secondary Card / Surface Background**: `#120A14`
- **Deep Burgundy Border / Accents**: `#24101F`
- **Accent Purple / Containers**: `#54265F`
- **Architect Signature Glow**: `#8B4AA8`
- **Antique Gold (Headings, primary CTA, badges)**: `#D4AF37` / `#F2D89A`
- **Pearl White Text**: `#F5EEDC`
- **Muted Lilac Secondary Text**: `#C7BAC8`
- **Eliminated / Traitor Red Accent**: `#DC2626` / `#EF4444`

### B. Visual Anti-Patterns (STRICTLY PROHIBITED)
- ❌ NO heavy castle wallpapers, stone dungeons, curtains, or dripping candles.
- ❌ NO physical poker/gaming tables, casino chips, or playing cards.
- ❌ NO cluttered AI suspicion score cards, radar dials, or analytics widgets unless explicitly requested.
- ❌ **ZERO ROLE LEAKAGE**: Secret roles are strictly confidential. A player's role must NEVER appear in public player lists (Discussion, Morning Announcement, Voting). Only the player themselves sees their role on the Secret Role Reveal page and role-specific night action panel.

### C. Frontend Code Conventions
Every game phase and major feature follows an isolated, predictable triad:
1. `src/types/<phase>.ts` — Strict TypeScript interfaces and state models.
2. `src/services/<phase>Service.ts` — Mock adapters with seamless REST/WebSocket upgrade paths.
3. `src/hooks/use<Phase>.ts` — React hook encapsulating state, timers, and actions.
4. `src/components/<phase>/` — Modular presentational components and a master `<Phase>Container.tsx`.
5. `src/app/game/<phase>/page.tsx` — Next.js page route (with top-level alias e.g. `src/app/<phase>/page.tsx`).

---

## 3. IMPLEMENTATION STATUS (PAGES 1 TO 10 COMPLETED)

All 10 initial pages have been built and compiled with 0 build errors:

| Page # | Page Name | Primary Route | Description & Key Features |
| :--- | :--- | :--- | :--- |
| **Page 1** | **Landing Page** | `/` | Hero section with hooded Architect avatar, ambient glow, features showcase, and CTA into game. |
| **Page 2** | **Login & Registration** | `/login` (`/auth/login`) | Dual tabs for Sign In / Create Account, password visibility toggle, antique gold CTAs, demo bypass. |
| **Page 3** | **Player Dashboard** | `/dashboard` | Welcome banner, quick action cards (Create/Join Game), player stats overview, match history, and role distribution chart. |
| **Page 4** | **Create / Join Game** | `/lobby/create` (`/game/create`) | Tabbed view for Create Room (player capacity, phase timers, privacy) & Join Room (code entry). Role distribution breakdown. |
| **Page 5** | **Multiplayer Game Lobby** | `/lobby` (`/game/lobby`) | Room code badge with 1-click copy, horizontal 8-player slot row (Host, Ready/Not Ready badges), live chat, and Host Start Game CTA. |
| **Page 6** | **Secret Role Reveal** | `/game/role-reveal` (`/role-reveal`) | High-stakes reveal immediately after game starts. Player-only role card (Traitor, Doctor, Detective, Faithful) with abilities, objective, and privacy warning. |
| **Page 7** | **Discussion Phase** | `/game/discussion` (`/game`) | 3-column gameplay layout: Left (Living/Eliminated player roster), Center (Architect announcement banner, message feed, input bar), Right (Architect portrait & round info). |
| **Page 8** | **Night Phase** | `/game/night` (`/night`) | 2-column layout: Left (Players list), Right (Night header with countdown `00:30`, Architect prompt, role-specific action panel: Traitor kill / Doctor save / Detective investigate). |
| **Page 9** | **Morning Announcement** | `/game/morning` (`/morning`) | Elimination reveal after night. Single violet Architect banner (*"The night has ended. Arnav has been eliminated."*), central eliminated player profile with red badge, and Continue to Discussion button. |
| **Page 10** | **Voting Phase** | `/game/voting` (`/voting`) | 2-column layout: Left (7 players with alive/eliminated statuses), Right (Ballot box header with countdown `01:30`, Architect banner, 5 eligible targets row excluding self and eliminated, Submit Vote CTA, submitted waiting state). |

---

## 4. CODEBASE FILE STRUCTURE MAP

```text
ai-traitors-the-architect/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI application entrypoint
│   │   ├── api/v1/health.py           # Health check endpoints
│   │   ├── core/config.py             # App settings & CORS configuration
│   │   ├── game_engine/               # Core state machines, phases, role logic
│   │   ├── ai_engine/                 # Multi-agent LLM prompts & orchestrators
│   │   ├── communication/             # WebSocket handlers for real-time rooms
│   │   └── database/                  # Models & database adapters
│   └── requirements.txt
│
└── frontend/
    ├── public/images/                 # Cinematic hooded Architect & avatar assets
    └── src/
        ├── app/
        │   ├── page.tsx               # Page 1: Landing Page
        │   ├── auth/                  # Page 2: Authentication
        │   ├── dashboard/             # Page 3: Player Dashboard
        │   ├── lobby/                 # Page 4 & 5: Create/Join & Game Lobby
        │   └── game/
        │       ├── page.tsx           # Multi-phase dispatcher (?phase=...)
        │       ├── role-reveal/       # Page 6: Secret Role Reveal
        │       ├── discussion/        # Page 7: Discussion Gameplay
        │       ├── night/             # Page 8: Night Phase
        │       ├── morning/           # Page 9: Morning Announcement
        │       └── voting/            # Page 10: Voting Phase
        ├── components/
        │   ├── auth/                  # LoginForm, RegisterForm
        │   ├── dashboard/             # DashboardHeader, Stats, RecentMatches, RoleChart
        │   ├── lobby/                 # LobbyHeader, PlayerCard, LobbyChat, SettingsPanel
        │   ├── reveal/                # RoleCard, RoleAbilities, RoleObjective
        │   ├── discussion/            # DiscussionFeed, MessageInput, ArchitectCard
        │   ├── night/                 # NightHeader, NightActionPanel, TargetSelector
        │   ├── morning/               # MorningHeader, MorningAnnouncement, EliminatedCard
        │   └── voting/                # VotingHeader, VotingAnnouncement, VotingActionPanel
        ├── hooks/                     # useDiscussion, useNightPhase, useMorningAnnouncement, useVotingPhase
        ├── services/                  # votingService, morningService, nightPhaseService, discussionService, lobbyService
        └── types/                     # votingPhase, morningAnnouncement, nightPhase, discussion, lobby, roleReveal
```

---

## 5. NEXT STEPS & UPCOMING TASKS

When continuing this project, your upcoming milestones will include:
1. **Page 11: Voting Results & Elimination Reveal**:
   - Screen showing the outcome of the vote tally.
   - Revealing which player was banished by majority vote, and whether they were a Faithful or a Traitor.
2. **Page 12: End Game / Victory Screen**:
   - Condition triggers when all Traitors are eliminated (Faithful Victory) or when Traitors equal/outnumber Faithful (Traitor Victory).
   - Summary of players, roles revealed, and match statistics.
3. **Real-Time WebSocket Integration**:
   - Connect frontend service adapters (`discussionService`, `votingService`, etc.) to backend WebSocket endpoints for live multi-user synchronization.
4. **AI Architect Game Master**:
   - Connect backend LLM service to dynamically generate dramatic morning announcements and provide subtle game hints.
```
