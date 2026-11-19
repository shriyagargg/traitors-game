import {
  VotingPlayer,
  VotingTarget,
  VotingPhaseState,
} from "@/types/votingPhase";
import { getApiBaseUrl, getWsBaseUrl } from "./rooms";
import { getPlayerSession, ensureRoomSession } from "./playerSession";

export class VotingService {
  private state: VotingPhaseState;
  private listeners: Set<(state: VotingPhaseState) => void> = new Set();
  private timerInterval: NodeJS.Timeout | null = null;
  private socket: WebSocket | null = null;
  private disposed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private serverPhaseEndsAt: number = 0;
  private serverPlayers: any[] = [];

  constructor(roomCode = "", roundNumber = 1) {
    const session = getPlayerSession(roomCode);

    this.state = {
      roomCode: roomCode.toUpperCase(),
      roundNumber: roundNumber,
      phaseType: "Day",
      timerSeconds: 0,
      currentUserId: session.id,
      selectedTargetId: null,
      isSubmitted: false,
      submittedTargetName: null,
      connectionStatus: "disconnected",
      hasSynced: false,
      allPlayers: [],
      targets: [],
    };

    void this.init();
    this.startCountdown();
  }

  public async reinit(roomCode: string) {
    if (!roomCode || roomCode === this.state.roomCode) return;
    this.state.roomCode = roomCode.toUpperCase();
    await this.init();
  }

  private async init() {
    if (typeof window === "undefined" || !this.state.roomCode) return;
    let session = getPlayerSession(this.state.roomCode);
    if (!session.token && session.accountToken) {
      session = await ensureRoomSession(this.state.roomCode);
      if (session.id) {
        this.updateState({ currentUserId: session.id });
      }
    }
    await this.fetchInitialState();
    this.initWebSocket();
  }

  private syncPlayers(rawPlayers: any[]) {
    if (!rawPlayers || !Array.isArray(rawPlayers)) return;
    this.serverPlayers = rawPlayers;
    const allPlayers = this.serverPlayers.map((p) => ({
      id: p.id,
      name: (p.name || "").replace(" (You)", ""),
      avatarUrl: p.avatar_url || p.avatarUrl || "",
      isAlive: p.is_alive ?? (p.status === "ALIVE"),
      isHost: p.is_host ?? false,
      isCurrentUser: p.id === this.state.currentUserId,
    }));

    const targets = this.computeTargets();
    this.updateState({ allPlayers, targets });
  }

  private computeTargets(): VotingTarget[] {
    if (this.serverPlayers.length > 0) {
      const viewer = this.serverPlayers.find((p) => p.id === this.state.currentUserId);
      if (!viewer || !(viewer.is_alive ?? (viewer.status === "ALIVE"))) return [];
      return this.serverPlayers
        .filter((p) => p.id !== this.state.currentUserId && (p.is_alive ?? (p.status === "ALIVE")))
        .map((p) => ({
          id: p.id,
          name: (p.name || "").replace(" (You)", ""),
          avatarUrl: p.avatar_url || p.avatarUrl || "",
          isSelectable: true,
        }));
    }
    return [];
  }

  private async fetchInitialState() {
    if (typeof window === "undefined" || !this.state.roomCode) return;
    let session = getPlayerSession(this.state.roomCode);
    if (!session.token && session.accountToken) {
      session = await ensureRoomSession(this.state.roomCode);
      if (session.id) {
        this.updateState({ currentUserId: session.id });
      }
    }
    const apiUrl = getApiBaseUrl();

    try {
      const res = await fetch(
        `${apiUrl}/api/v1/game/${this.state.roomCode}/state?player_id=${session.id}&token=${encodeURIComponent(session.token || "")}&account_token=${encodeURIComponent(session.accountToken || "")}`
      );
      if (res.ok) {
        const data = await res.json();
        this.syncPlayers(data.players || []);
        const eligibleVoters = (data.players || []).filter((p: any) => p.is_alive ?? p.status === "ALIVE").length;
        const votesCast = Number(data.total_votes_cast || 0);
        this.updateState({ isSubmitted: Boolean(data.has_voted), votesCast, eligibleVoters,
          allVotesRecorded: eligibleVoters > 0 && votesCast >= eligibleVoters, serverPhase: data.phase });
        if (data.phase !== "VOTING") {
          this.updateState({ allVotesRecorded: data.phase === "VOTING_RESULTS", isTimeUp: data.phase !== "VOTING" });
        }
        if (data.phase_ends_at || typeof data.timer_seconds === "number") {
          this.serverPhaseEndsAt = Number(data.phase_ends_at) || 0;
          const remaining = this.serverPhaseEndsAt
            ? Math.max(0, Math.ceil(this.serverPhaseEndsAt - Date.now() / 1000))
            : 0;
          this.updateState({
            timerSeconds: remaining,
            roundNumber: data.round_number || this.state.roundNumber,
            isTimeUp: remaining <= 0,
          });
        }
        this.updateState({ hasSynced: true });
      } else if (!this.disposed && (!this.serverPlayers || this.serverPlayers.length === 0)) {
        setTimeout(() => { if (!this.disposed) void this.fetchInitialState(); }, 1500);
      }
    } catch {
      if (!this.disposed && (!this.serverPlayers || this.serverPlayers.length === 0)) {
        setTimeout(() => { if (!this.disposed) void this.fetchInitialState(); }, 1500);
      }
    }
  }

  private initWebSocket() {
    if (typeof window === "undefined" || this.disposed || !this.state.roomCode) return;
    const session = getPlayerSession(this.state.roomCode);
    if (!session.token) return;
    const wsUrl = `${getWsBaseUrl()}/api/v1/ws/game/${this.state.roomCode}?player_id=${session.id}&token=${encodeURIComponent(session.token || "")}&account_token=${encodeURIComponent(session.accountToken || "")}`;

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
            if (nextPhase) this.updateState({ serverPhase: nextPhase });
            if (packet.payload?.phase === "VOTING") {
              const players = packet.payload.players || [];
              const eligibleVoters = players.filter((p: any) => p.is_alive ?? (p.status === "ALIVE")).length;
              const votesCast = Number(packet.payload.total_votes_cast || 0);
              this.updateState({ votesCast, eligibleVoters, allVotesRecorded: eligibleVoters > 0 && votesCast >= eligibleVoters });
            }
            if (nextPhase === "VOTING_RESULTS" || nextPhase === "RESULTS") {
              this.updateState({ allVotesRecorded: true, timerSeconds: 0 });
            }
            if (nextPhase === "VOTING" && packet.payload?.phase_ends_at) {
              this.serverPhaseEndsAt = packet.payload.phase_ends_at;
              this.updateState({ timerSeconds: Math.max(0, Math.ceil(this.serverPhaseEndsAt - Date.now() / 1000)), isTimeUp: false, hasSynced: true });
              this.startCountdown();
            }
            if (packet.payload?.players) {
              this.syncPlayers(packet.payload.players);
            }
          } else if (packet.type === "INITIAL_SYNC" && packet.payload) {
            if (packet.payload.phase) {
              const players = packet.payload.players || [];
              const eligibleVoters = players.filter((p: any) => p.is_alive ?? (p.status === "ALIVE")).length;
              const votesCast = Number(packet.payload.total_votes_cast || 0);
              this.updateState({ serverPhase: packet.payload.phase, votesCast, eligibleVoters,
                allVotesRecorded: eligibleVoters > 0 && votesCast >= eligibleVoters });
            }
            if (packet.payload.players) {
              this.syncPlayers(packet.payload.players);
            }
            if (packet.payload.phase_ends_at || typeof packet.payload.timer_seconds === "number") {
              this.serverPhaseEndsAt = Number(packet.payload.phase_ends_at) || 0;
              const remaining = this.serverPhaseEndsAt
                ? Math.max(0, Math.ceil(this.serverPhaseEndsAt - Date.now() / 1000))
                : 0;
              if (packet.payload.phase !== "VOTING") {
                this.updateState({ isTimeUp: true, allVotesRecorded: packet.payload.phase === "VOTING_RESULTS" });
              }
              this.updateState({ timerSeconds: remaining, hasSynced: true, isTimeUp: remaining <= 0 });
              if (remaining > 0 && packet.payload.phase === "VOTING") this.startCountdown();
            }
          } else if (packet.type === "VOTE_CAST") {
            const votes = packet.payload?.totalVotesCast || 0;
            const eligible = packet.payload?.eligibleVoters || 0;
            this.updateState({ votesCast: votes, eligibleVoters: eligible, allVotesRecorded: eligible > 0 && votes >= eligible });
          }
        } catch {
          // ignore corrupted packets
        }
      };

      ws.onerror = () => {
        this.socket = null;
        this.updateState({ connectionStatus: "disconnected" });
      };

      ws.onclose = (event) => {
        this.socket = null;
        this.updateState({ connectionStatus: "disconnected" });
        if (event.code === 4404 || event.code === 4401) return;
        if (!this.disposed) {
          this.reconnectTimer = setTimeout(() => this.initWebSocket(), 1500);
        }
      };
    } catch {
      this.updateState({ connectionStatus: "disconnected" });
    }
  }

  private startCountdown() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (!this.serverPhaseEndsAt) return;
      const nextSec = Math.max(0, Math.ceil(this.serverPhaseEndsAt - Date.now() / 1000));

      this.updateState({
        timerSeconds: nextSec,
        isTimeUp: nextSec === 0,
      });
      if (nextSec === 0) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = null;
        void this.fetchInitialState();
      }

    }, 1000);
  }

  public fastForward() {
    // Phase timing is controlled by the backend; clients only display it.
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
    if (this.state.targets && this.state.targets.length > 0) {
      return this.state.targets;
    }
    return this.computeTargets();
  }

  public getAllPlayers(): any[] {
    return this.state.allPlayers || [];
  }

  public selectTarget(targetId: string) {
    if (this.state.isSubmitted) return;
    this.updateState({ selectedTargetId: targetId });
  }

  public async submitVote(): Promise<{ success: boolean; message: string }> {
    if (!this.state.hasSynced || this.state.isTimeUp || this.state.isSubmitted) return { success: false, message: "Voting is closed or already submitted." };
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
          token: session.token, account_token: session.accountToken,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        return { success: false, message: result.detail || result.message || "Vote was rejected." };
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
    // Phase timing is controlled by the backend; clients cannot reset it.
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
