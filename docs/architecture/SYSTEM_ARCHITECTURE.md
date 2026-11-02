# AI TRAITORS — System Architecture Specification
## The Architect: Autonomous Multi-Agent Game Master

> **Document Class:** Academic Architectural Blueprint  
> **Course Alignment:** Software Engineering / Multi-Agent Systems / Distributed Systems  
> **Target Audience:** Development Team & Academic Examination Panel

---

## 1. System Topology Overview

**AI TRAITORS** is engineered as a decoupled, asynchronous, event-driven multiplayer gaming and AI reasoning platform. The system operates across four primary layers:

```
[ Next.js 15 Cinematic UI & Client ]
               ↕ (WebSockets / WebRTC Audio)
[ FastAPI Real-Time Gateway & REST Endpoints ]
               ↕ (Event Bus)
[ Deterministic Game Engine ] ──(Events)──> [ The Architect: Multi-Agent Engine ]
               ↕                                          ↕
[ PostgreSQL + Migrations ]                [ Epistemic Knowledge Stores & pgvector ]
```

---

## 2. Layer Separation & Responsibilities

### 2.1 Presentation Layer (`frontend/`)
* **Tech Stack**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS.
* **Responsibilities**:
  * Immersive cinematic dark theme (void black `#070709`, charcoal, burgundy `#881337`, gold `#d4af37`).
  * Real-time HUD displaying round timers, living/eliminated player status, and active discussion chat.
  * Role-specific action interfaces:
    * Traitor: Night assassination target selection and secret traitor chat.
    * Doctor: Night protection target selection.
    * Detective: Night investigation target selection and private verdict logs.
    * Faithful: Daytime cross-examination and voting council ballots.
  * WebRTC peer-to-peer voice streaming interface with mute/deafen and speaking activity indicators.

### 2.2 Real-Time Gateway Layer (`backend/app/communication/`)
* **Tech Stack**: FastAPI WebSockets, Starlette connection routing, WebRTC Signaling Hub.
* **Responsibilities**:
  * Room multiplexing: routes incoming events to the appropriate room instance.
  * Role-based access control (RBAC): enforces authorization for confidential channels (e.g., only living Traitors can join the Traitor WebSocket channel).
  * WebRTC SDP offer/answer exchange and ICE candidate trickle.

### 2.3 Deterministic Game Engine (`backend/app/game_engine/`)
* **Tech Stack**: Pure Python Finite State Machine (FSM), Pydantic v2 schemas.
* **Invariant**: **The Game Engine is the SOLE authority for rules, state transitions, and win conditions.**
* **Sub-Modules**:
  * `state.py`: Discrete game states (`LOBBY`, `ROLE_ASSIGNMENT`, `NIGHT`, `MORNING_ANNOUNCEMENT`, `DAY_DISCUSSION`, `VOTING`, `ELIMINATION_REVEAL`, `GAME_OVER`).
  * `roles.py`: Role definitions, night abilities, and faction alignments.
  * `phases.py`: Transition rules and configurable timer intervals.
  * `night_actions.py`: Priority queue action resolution (`Doctor Protect` overrides `Traitor Assassination`).
  * `voting.py`: Secret/public ballots, tie-breaking mechanisms, and majority verification.
  * `win_conditions.py`: Terminal state evaluators:
    * **Faithful Victory**: Number of active Traitors $= 0$.
    * **Traitor Victory**: Number of active Traitors $\ge$ Number of active Faithfuls.

### 2.4 The Architect: Multi-Agent AI Engine (`backend/app/ai_engine/`)
* **Tech Stack**: LangGraph workflow coordinator, Gemini/OpenAI API adapter, pgvector memory.
* **Specialized Agent Modules**:
  1. `orchestrator.py`: Master workflow controller receiving engine events and coordinating agents.
  2. `rule_agent.py`: Validates action preconditions before passing commands to engine.
  3. `knowledge_agent.py`: Partitioned epistemic stores ($K_{\text{world}}, K_{\text{claims}}, K_{\text{inferred}}$).
  4. `reasoning_agent.py`: Cross-examines current utterances against historical claims to detect contradictions.
  5. `strategy_agent.py`: Evaluates voting patterns, defense coalitions, and outputs explainable suspicion scores $S(p)$.
  6. `planning_agent.py`: Evaluates state-space trajectories ($A^*$ simulation).
  7. `communication_agent.py`: Synthesizes atmospheric narration, claims extraction, and Game Master announcements.

---

## 3. Epistemic Security & Information Firewall

To guarantee zero leakage of secret roles:
1. **Encrypted Storage**: True roles in `PLAYER_ROLES` are encrypted and indexed strictly by server-side UUIDs.
2. **Context Masking**: The Communication Agent and Public Narration LLM prompts **never** receive the role table or private night action logs.
3. **Unicast Delivery**: Doctor saves and Detective investigation results are serialized and delivered exclusively to the actor's private WebSocket session.
