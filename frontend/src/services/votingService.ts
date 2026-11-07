import {
  VotingPlayer,
  VotingTarget,
  VotingPhaseState,
} from "@/types/votingPhase";

export const INITIAL_VOTING_PLAYERS: VotingPlayer[] = [
  {
    id: "p_somya",
    name: "Somya (You)",
    avatarUrl: "/images/player_somya.png",
    isAlive: true,
    isHost: true,
    isCurrentUser: true,
  },
  {
    id: "p_shubh",
    name: "Shubh",
    avatarUrl: "/images/player_shubh.png",
    isAlive: true,
    isHost: false,
    isCurrentUser: false,
  },
  {
    id: "p_pari",
    name: "Pari",
    avatarUrl: "/images/player_pari.png",
    isAlive: true,
    isHost: false,
    isCurrentUser: false,
  },
  {
    id: "p_arnav",
    name: "Arnav",
    avatarUrl: "/images/player_arnav.png",
    isAlive: false, // In reference mockup Arnav is Eliminated!
    isHost: false,
    isCurrentUser: false,
  },
  {
    id: "p_riya",
    name: "Riya",
    avatarUrl: "/images/player_riya.png",
    isAlive: true,
    isHost: false,
    isCurrentUser: false,
  },
  {
    id: "p_vivaan",
    name: "Vivaan",
    avatarUrl: "/images/player_vivaan.png",
    isAlive: true,
    isHost: false,
    isCurrentUser: false,
  },
  {
    id: "p_ishita",
    name: "Ishita",
    avatarUrl: "/images/player_ishita.png",
    isAlive: true,
    isHost: false,
    isCurrentUser: false,
  },
];

export class VotingService {
  private state: VotingPhaseState;
  private listeners: Set<(state: VotingPhaseState) => void> = new Set();
  private timerInterval: NodeJS.Timeout | null = null;
  private socket: WebSocket | null = null;

  constructor(roomCode = "A7K4D9", roundNumber = 2) {
    this.state = {
      roomCode: roomCode.toUpperCase(),
      roundNumber: roundNumber,
      phaseType: "Day",
      timerSeconds: 90, // 01:30 as shown in mockup
      currentUserId: "p_somya",
      selectedTargetId: null, // Initially unselected per mockup
      isSubmitted: false,
      submittedTargetName: null,
      connectionStatus: "mock_preview",
    };

    this.startCountdown();
    this.initWebSocket(roomCode);
  }

  private initWebSocket(roomCode: string) {
    if (typeof window === "undefined") return;

    try {
      const wsUrl =
        process.env.NEXT_PUBLIC_WS_URL ||
        `ws://localhost:8000/api/v1/ws/game/${roomCode}/voting`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        this.socket = ws;
        this.updateState({ connectionStatus: "connected" });
      };

      ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          if (
            packet.type === "VOTING_TIMER_SYNC" &&
            typeof packet.payload?.seconds === "number"
          ) {
            this.updateState({ timerSeconds: packet.payload.seconds });
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

  private startCountdown() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (this.state.timerSeconds > 0) {
        this.updateState({ timerSeconds: this.state.timerSeconds - 1 });
      }
    }, 1000);
  }

  public getState(): VotingPhaseState {
    return this.state;
  }

  public subscribe(listener: (state: VotingPhaseState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<VotingPhaseState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((cb) => cb(this.state));
  }

  // Get eligible voting targets (living players excluding self and eliminated)
  public getEligibleTargets(): VotingTarget[] {
    return INITIAL_VOTING_PLAYERS.filter(
      (p) => p.isAlive && p.id !== this.state.currentUserId
    ).map((p) => ({
      id: p.id,
      name: p.name.replace(" (You)", ""),
      avatarUrl: p.avatarUrl,
      isSelectable: true,
    }));
  }

  public selectTarget(targetId: string) {
    if (this.state.isSubmitted) return;
    this.updateState({ selectedTargetId: targetId });
  }

  public async submitVote(): Promise<{ success: boolean; message: string }> {
    if (!this.state.selectedTargetId) {
      return { success: false, message: "Please select a target first." };
    }

    const target = this.getEligibleTargets().find(
      (t) => t.id === this.state.selectedTargetId
    );
    const targetName = target ? target.name : null;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiUrl}/api/v1/game/${this.state.roomCode}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: this.state.currentUserId,
          roundNumber: this.state.roundNumber,
          targetId: this.state.selectedTargetId,
        }),
      });
    } catch {
      // Backend vote endpoint on standby
    }

    this.updateState({
      isSubmitted: true,
      submittedTargetName: targetName,
    });

    return {
      success: true,
      message: "Vote recorded successfully.",
    };
  }

  public resetVote() {
    this.updateState({
      selectedTargetId: null,
      isSubmitted: false,
      submittedTargetName: null,
    });
  }

  public resetTimer() {
    this.updateState({ timerSeconds: 90 });
  }

  public destroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
