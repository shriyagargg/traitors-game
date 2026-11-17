import {
  VotingPlayer,
  VotingTarget,
  VotingPhaseState,
} from "@/types/votingPhase";
import { getApiBaseUrl, getWsBaseUrl } from "./rooms";
import { getPlayerSession } from "./playerSession";

export class VotingService {
  private state: VotingPhaseState;
  private listeners: Set<(state: VotingPhaseState) => void> = new Set();
  private timerInterval: NodeJS.Timeout | null = null;
  private socket: WebSocket | null = null;
  private disposed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private serverPhaseEndsAt: number = 0;
  private serverPlayers: any[] = [];

  constructor(roomCode = "A7K4D9", roundNumber = 1) {
    const session = getPlayerSession(roomCode);

    this.state = {
      roomCode: roomCode.toUpperCase(),
      roundNumber: roundNumber,
      phaseType: "Day",
      timerSeconds: 60,
      currentUserId: session.id,
      selectedTargetId: null,
      isSubmitted: false,
      submittedTargetName: null,
      connectionStatus: "mock_preview",
    };

    this.fetchInitialState();
    this.initWebSocket();
    this.startCountdown();
  }

  private async fetchInitialState() {
    if (typeof window === "undefined") return;
    const session = getPlayerSession(this.state.roomCode);
    const apiUrl = getApiBaseUrl();

    try {
      const res = await fetch(
        `${apiUrl}/api/v1/game/${this.state.roomCode}/state?player_id=${session.id}&token=${encodeURIComponent(session.token || "")}`
      );
      if (res.ok) {
        const data = await res.json();
        this.serverPlayers = data.players || [];
        if (data.phase_ends_at) {
          this.serverPhaseEndsAt = data.phase_ends_at;
          const remaining = Math.max(0, Math.floor(data.phase_ends_at - Date.now() / 1000));
          this.updateState({
            timerSeconds: remaining,
            roundNumber: data.round_number || this.state.roundNumber,
          });
        }
      }
    } catch {
      // Backend standby
    }
  }

  private initWebSocket() {
    if (typeof window === "undefined") return;
    const session = getPlayerSession(this.state.roomCode);
    const wsUrl = `${getWsBaseUrl()}/api/v1/ws/game/${this.state.roomCode}?player_id=${session.id}&token=${encodeURIComponent(session.token || "")}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        this.socket = ws;
        this.updateState({ connectionStatus: "connected" });
      };

      ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          if (packet.type === "PHASE_CHANGED") {
            const nextPhase = packet.payload?.phase;
            if (nextPhase === "VOTING_RESULTS" || nextPhase === "RESULTS") {
              this.updateState({ allVotesRecorded: true, timerSeconds: 0 });
            } else if (packet.payload) {
              this.serverPlayers = packet.payload.players || [];
              if (packet.payload.phase_ends_at) {
                this.serverPhaseEndsAt = packet.payload.phase_ends_at;
                const remaining = Math.max(
                  0,
                  Math.floor(packet.payload.phase_ends_at - Date.now() / 1000)
                );
                this.updateState({ timerSeconds: remaining });
              }
            }
          } else if (packet.type === "INITIAL_SYNC" && packet.payload) {
            this.serverPlayers = packet.payload.players || [];
            if (packet.payload.phase_ends_at) {
              this.serverPhaseEndsAt = packet.payload.phase_ends_at;
              const remaining = Math.max(
                0,
                Math.floor(packet.payload.phase_ends_at - Date.now() / 1000)
              );
              this.updateState({ timerSeconds: remaining });
            }
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
        if (!this.disposed) {
          this.reconnectTimer = setTimeout(() => this.initWebSocket(), 1500);
        }
      };
    } catch {
      this.updateState({ connectionStatus: "mock_preview" });
    }
  }

  private startCountdown() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (!this.serverPhaseEndsAt) return;
      const nextSec = Math.max(0, Math.floor(this.serverPhaseEndsAt - Date.now() / 1000));

      this.updateState({
        timerSeconds: nextSec,
        isTimeUp: nextSec === 0,
      });

    }, 1000);
  }

  public fastForward() {
    if (!this.state.selectedTargetId) {
      const eligible = this.getEligibleTargets();
      if (eligible.length > 0) {
        this.selectTarget(eligible[0].id);
      }
    }
    this.updateState({ timerSeconds: 0, isTimeUp: true });
    if (!this.state.isSubmitted) {
      this.submitVote();
    }
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

  // Get eligible voting targets (living players excluding self)
  public getEligibleTargets(): VotingTarget[] {
    if (this.serverPlayers.length > 0) {
      return this.serverPlayers
        .filter((p) => p.id !== this.state.currentUserId && (p.is_alive ?? (p.status === "ALIVE")))
        .map((p) => ({
          id: p.id,
          name: p.name.replace(" (You)", ""),
          avatarUrl: p.avatar_url || p.avatarUrl || "/images/player_shubh.png",
          isSelectable: true,
        }));
    }

    return [];
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
    const session = getPlayerSession(this.state.roomCode);

    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/v1/game/${this.state.roomCode}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: this.state.currentUserId,
          roundNumber: this.state.roundNumber,
          targetId: this.state.selectedTargetId,
          token: session.token,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        return { success: false, message: result.message || "Vote was rejected." };
      }
    } catch {
      return { success: false, message: "Game server is unavailable." };
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
    this.updateState({ timerSeconds: 60 });
  }

  public destroy() {
    this.disposed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
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
