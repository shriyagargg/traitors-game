import {
  VictoryState,
  VictoryOutcome,
  RevealedPlayer,
} from "@/types/victory";

export const FAITHFUL_VICTORY_PLAYERS: RevealedPlayer[] = [
  {
    id: "p_somya",
    name: "Somya (You)",
    avatarUrl: "/images/player_somya.png",
    role: "Detective",
    isTraitor: false,
    status: "SURVIVED",
    statusRoundText: "Survived",
    isCurrentUser: true,
  },
  {
    id: "p_shubh",
    name: "Shubh",
    avatarUrl: "/images/player_shubh.png",
    role: "Traitor",
    isTraitor: true,
    status: "BANISHED",
    statusRoundText: "Banished Round 2",
    isCurrentUser: false,
  },
  {
    id: "p_pari",
    name: "Pari",
    avatarUrl: "/images/player_pari.png",
    role: "Faithful",
    isTraitor: false,
    status: "SURVIVED",
    statusRoundText: "Survived",
    isCurrentUser: false,
  },
  {
    id: "p_arnav",
    name: "Arnav",
    avatarUrl: "/images/player_arnav.png",
    role: "Faithful",
    isTraitor: false,
    status: "MURDERED",
    statusRoundText: "Murdered Night 1",
    isCurrentUser: false,
  },
  {
    id: "p_riya",
    name: "Riya",
    avatarUrl: "/images/player_riya.png",
    role: "Doctor",
    isTraitor: false,
    status: "SURVIVED",
    statusRoundText: "Survived",
    isCurrentUser: false,
  },
  {
    id: "p_vivaan",
    name: "Vivaan",
    avatarUrl: "/images/player_vivaan.png",
    role: "Faithful",
    isTraitor: false,
    status: "SURVIVED",
    statusRoundText: "Survived",
    isCurrentUser: false,
  },
  {
    id: "p_ishita",
    name: "Ishita",
    avatarUrl: "/images/player_ishita.png",
    role: "Traitor",
    isTraitor: true,
    status: "BANISHED",
    statusRoundText: "Banished Round 3",
    isCurrentUser: false,
  },
];

export const TRAITOR_VICTORY_PLAYERS: RevealedPlayer[] = [
  {
    id: "p_somya",
    name: "Somya (You)",
    avatarUrl: "/images/player_somya.png",
    role: "Detective",
    isTraitor: false,
    status: "MURDERED",
    statusRoundText: "Murdered Night 2",
    isCurrentUser: true,
  },
  {
    id: "p_shubh",
    name: "Shubh",
    avatarUrl: "/images/player_shubh.png",
    role: "Traitor",
    isTraitor: true,
    status: "SURVIVED",
    statusRoundText: "Victorious Traitor",
    isCurrentUser: false,
  },
  {
    id: "p_pari",
    name: "Pari",
    avatarUrl: "/images/player_pari.png",
    role: "Faithful",
    isTraitor: false,
    status: "BANISHED",
    statusRoundText: "Banished Round 2",
    isCurrentUser: false,
  },
  {
    id: "p_arnav",
    name: "Arnav",
    avatarUrl: "/images/player_arnav.png",
    role: "Faithful",
    isTraitor: false,
    status: "MURDERED",
    statusRoundText: "Murdered Night 1",
    isCurrentUser: false,
  },
  {
    id: "p_riya",
    name: "Riya",
    avatarUrl: "/images/player_riya.png",
    role: "Doctor",
    isTraitor: false,
    status: "BANISHED",
    statusRoundText: "Banished Round 3",
    isCurrentUser: false,
  },
  {
    id: "p_vivaan",
    name: "Vivaan",
    avatarUrl: "/images/player_vivaan.png",
    role: "Faithful",
    isTraitor: false,
    status: "SURVIVED",
    statusRoundText: "Deceived",
    isCurrentUser: false,
  },
  {
    id: "p_ishita",
    name: "Ishita",
    avatarUrl: "/images/player_ishita.png",
    role: "Traitor",
    isTraitor: true,
    status: "SURVIVED",
    statusRoundText: "Victorious Traitor",
    isCurrentUser: false,
  },
];

export class VictoryService {
  private state: VictoryState;
  private listeners: Set<(state: VictoryState) => void> = new Set();
  private socket: WebSocket | null = null;

  constructor(roomCode = "A7K4D9", outcome: VictoryOutcome = "FAITHFUL_VICTORY") {
    this.state = this.buildStateForOutcome(roomCode, outcome);
    this.initWebSocket(roomCode);
  }

  private buildStateForOutcome(
    roomCode: string,
    outcome: VictoryOutcome
  ): VictoryState {
    const isFaithful = outcome === "FAITHFUL_VICTORY";

    return {
      roomCode: roomCode.toUpperCase(),
      roundsPlayed: isFaithful ? 3 : 3,
      outcome: outcome,
      winningFaction: isFaithful ? "The Faithful" : "The Traitors",
      prizePool: "$120,000",
      architectVerdict: isFaithful
        ? "The darkness has broken. Every Traitor has been rooted out through vigilance and unity. The Faithful claim the castle and the gold."
        : "The deception was complete. The Traitors outsmarted the council and seized the castle's fortune. The Faithful leave with nothing.",
      revealedPlayers: isFaithful
        ? FAITHFUL_VICTORY_PLAYERS
        : TRAITOR_VICTORY_PLAYERS,
      stats: [
        { label: "Rounds Played", value: 3, subtext: "Day & Night Cycles" },
        {
          label: "Traitors Unmasked",
          value: isFaithful ? "2 of 2" : "0 of 2",
          subtext: isFaithful ? "100% Banished" : "Eluded Council",
        },
        {
          label: "Night Casualties",
          value: isFaithful ? 1 : 2,
          subtext: "Fell in Darkness",
        },
        {
          label: "Council Banished",
          value: isFaithful ? 2 : 2,
          subtext: "Circle of Truth",
        },
      ],
      connectionStatus: "mock_preview",
    };
  }

  private initWebSocket(roomCode: string) {
    if (typeof window === "undefined") return;

    try {
      const wsUrl =
        process.env.NEXT_PUBLIC_WS_URL ||
        `ws://localhost:8000/api/v1/ws/game/${roomCode}/victory`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        this.socket = ws;
        this.updateState({ connectionStatus: "connected" });
      };

      ws.onerror = () => {
        this.socket = null;
        this.updateState({ connectionStatus: "mock_preview" });
      };

      ws.onclose = () => {
        this.socket = null;
        this.updateState({ connectionStatus: "mock_preview" });
      };
    } catch {
      this.updateState({ connectionStatus: "mock_preview" });
    }
  }

  public getState(): VictoryState {
    return this.state;
  }

  public subscribe(listener: (state: VictoryState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<VictoryState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((cb) => cb(this.state));
  }

  public setOutcome(outcome: VictoryOutcome) {
    const newState = this.buildStateForOutcome(this.state.roomCode, outcome);
    this.state = newState;
    this.listeners.forEach((cb) => cb(this.state));
  }

  public destroy() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

