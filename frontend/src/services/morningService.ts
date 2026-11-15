import {
  MorningPlayer,
  MorningAnnouncementState,
} from "@/types/morningAnnouncement";

export const INITIAL_MORNING_PLAYERS: MorningPlayer[] = [
  {
    id: "p_somya",
    name: "Somya (You)",
    avatarUrl: "/images/player_somya.png",
    isAlive: true,
    isEliminatedTonight: false,
    isHost: true,
    isCurrentUser: true,
  },
  {
    id: "p_shubh",
    name: "Shubh",
    avatarUrl: "/images/player_shubh.png",
    isAlive: true,
    isEliminatedTonight: false,
    isHost: false,
    isCurrentUser: false,
  },
  {
    id: "p_pari",
    name: "Pari",
    avatarUrl: "/images/player_pari.png",
    isAlive: true,
    isEliminatedTonight: false,
    isHost: false,
    isCurrentUser: false,
  },
  {
    id: "p_arnav",
    name: "Arnav",
    avatarUrl: "/images/player_arnav.png",
    isAlive: false, // In reference mockup Arnav is Eliminated!
    isEliminatedTonight: true,
    isHost: false,
    isCurrentUser: false,
  },
  {
    id: "p_riya",
    name: "Riya",
    avatarUrl: "/images/player_riya.png",
    isAlive: true,
    isEliminatedTonight: false,
    isHost: false,
    isCurrentUser: false,
  },
  {
    id: "p_vivaan",
    name: "Vivaan",
    avatarUrl: "/images/player_vivaan.png",
    isAlive: true,
    isEliminatedTonight: false,
    isHost: false,
    isCurrentUser: false,
  },
  {
    id: "p_ishita",
    name: "Ishita",
    avatarUrl: "/images/player_ishita.png",
    isAlive: true,
    isEliminatedTonight: false,
    isHost: false,
    isCurrentUser: false,
  },
];

export class MorningService {
  private state: MorningAnnouncementState;
  private listeners: Set<(state: MorningAnnouncementState) => void> = new Set();
  private socket: WebSocket | null = null;

  constructor(roomCode = "A7K4D9", roundNumber = 2) {
    const defaultEliminated = INITIAL_MORNING_PLAYERS.find(
      (p) => p.isEliminatedTonight
    ) || null;

    this.state = {
      roomCode: roomCode.toUpperCase(),
      roundNumber: roundNumber,
      phaseType: "Day",
      eliminatedPlayer: defaultEliminated,
      players: [...INITIAL_MORNING_PLAYERS],
      roleRevealPermitted: false,
      connectionStatus: "mock_preview",
    };

    this.initWebSocket(roomCode);
    this.fetchMorningAnnouncement(roomCode, roundNumber);
  }

  private async fetchMorningAnnouncement(roomCode: string, roundNumber: number) {
    if (typeof window === "undefined") return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      // POST to resolve-night — will return Architect-generated announcement
      const res = await fetch(`${apiUrl}/api/v1/game/${roomCode}/resolve-night`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundNumber }),
      });
      if (!res.ok) throw new Error("resolve-night unavailable");
      const data = await res.json();
      if (data.architectAnnouncement) {
        // Update the announcement text shown in the banner
        this.updateState({ dynamicAnnouncement: data.architectAnnouncement });
      }
    } catch {
      // Backend offline — static mock announcement stays in place
    }
  }

  private initWebSocket(roomCode: string) {
    if (typeof window === "undefined") return;

    try {
      const wsUrl =
        process.env.NEXT_PUBLIC_WS_URL ||
        `ws://localhost:8000/api/v1/ws/game/${roomCode}/morning`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        this.socket = ws;
        this.updateState({ connectionStatus: "connected" });
      };

      ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          if (packet.type === "MORNING_STATE_UPDATE" && packet.payload) {
            this.updateState(packet.payload);
          }
        } catch {
          // ignore corrupted packets
        }
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

  public getState(): MorningAnnouncementState {
    return this.state;
  }

  public subscribe(listener: (state: MorningAnnouncementState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<MorningAnnouncementState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((cb) => cb(this.state));
  }

  // Demo simulation helper: Toggle between "Arnav Eliminated" and "No Elimination"
  public toggleEliminationScenario() {
    if (this.state.eliminatedPlayer) {
      // Switch to No Elimination
      const allAlive = this.state.players.map((p) => ({
        ...p,
        isAlive: true,
        isEliminatedTonight: false,
      }));
      this.updateState({
        eliminatedPlayer: null,
        players: allAlive,
      });
    } else {
      // Switch to Arnav Eliminated
      const withElimination = this.state.players.map((p) =>
        p.id === "p_arnav"
          ? { ...p, isAlive: false, isEliminatedTonight: true }
          : { ...p, isAlive: true, isEliminatedTonight: false }
      );
      const target = withElimination.find((p) => p.id === "p_arnav") || null;
      this.updateState({
        eliminatedPlayer: target,
        players: withElimination,
      });
    }
  }

  public destroy() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
