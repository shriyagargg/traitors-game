import { GameRole } from "@/types/roleReveal";
import {
  NightRoleConfig,
  NightPhaseState,
  NightPlayerTarget,
} from "@/types/nightPhase";
import { getPlayerSession, ensureRoomSession } from "./playerSession";
import { getApiBaseUrl, getWsBaseUrl } from "./rooms";

export const NIGHT_ROLE_CONFIGS: Record<GameRole, NightRoleConfig> = {
  traitor: {
    role: "traitor",
    actionType: "elimination",
    heading: "Traitor Action",
    subtitle: "Choose one player to eliminate.",
    buttonText: "Confirm Elimination",
    accentColor: "#DC2626",
    ringClass: "ring-2 ring-red-500 shadow-[0_0_20px_rgba(220,38,38,0.6)]",
    radioBgClass: "bg-red-500 border-red-400",
    announcementText: "It is night. Traitors, make your move.",
  },
  doctor: {
    role: "doctor",
    actionType: "protection",
    heading: "Doctor Protection",
    subtitle: "Choose one player to protect tonight.",
    buttonText: "Confirm Protection",
    accentColor: "#10B981",
    ringClass: "ring-2 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.6)]",
    radioBgClass: "bg-emerald-500 border-emerald-400",
    announcementText: "It is night. Doctor, make your move.",
  },
  detective: {
    role: "detective",
    actionType: "investigation",
    heading: "Detective Investigation",
    subtitle: "Choose one player to investigate tonight.",
    buttonText: "Confirm Investigation",
    accentColor: "#D4AF37",
    ringClass: "ring-2 ring-gold-antique shadow-[0_0_20px_rgba(212,175,55,0.6)]",
    radioBgClass: "bg-gold-antique border-gold-light",
    announcementText: "It is night. Detective, make your move.",
  },
  faithful: {
    role: "faithful",
    actionType: "none",
    heading: "The Night is in Progress",
    subtitle:
      "You have no action tonight. Stay alert and prepare for the morning discussion.",
    buttonText: "",
    accentColor: "#60A5FA",
    ringClass: "ring-2 ring-blue-500",
    radioBgClass: "bg-blue-500 border-blue-400",
    announcementText: "It is night. Rest and await the morning.",
  },
};

export class NightPhaseService {
  private state: NightPhaseState;
  private listeners: Set<(state: NightPhaseState) => void> = new Set();
  private timerInterval: NodeJS.Timeout | null = null;
  private socket: WebSocket | null = null;
  private disposed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private serverPhaseEndsAt: number = 0;
  private serverPlayers: any[] = [];

  constructor(roomCode = "", initialRole: GameRole = "traitor", roundNumber = 1) {
    const session = getPlayerSession(roomCode);

    this.state = {
      roomCode: roomCode.toUpperCase(),
      roundNumber: roundNumber,
      timerSeconds: 0,
      currentRole: initialRole,
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
      name: (p.name || "Player").replace(" (You)", ""),
      avatarUrl: p.avatar_url || p.avatarUrl || "",
      isAlive: p.is_alive ?? (p.status === "ALIVE"),
      isHost: p.is_host ?? false,
      isCurrentUser: p.id === this.state.currentUserId,
    }));

    const targets = this.computeTargets();
    this.updateState({ allPlayers, targets });
  }

  private computeTargets(): NightPlayerTarget[] {
    if (this.state.currentRole === "faithful") {
      return [];
    }

    if (this.serverPlayers.length > 0) {
      return this.serverPlayers
        .filter((p) => p.id !== this.state.currentUserId && (p.is_alive ?? (p.status === "ALIVE")))
        .map((p) => ({
          id: p.id,
          name: (p.name || "Player").replace(" (You)", ""),
          avatarUrl: p.avatar_url || p.avatarUrl || "",
          isAlive: true,
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
        if (data.viewer_role && data.viewer_role !== "Unknown") {
          const roleLower = data.viewer_role.toLowerCase() as GameRole;
          if (["traitor", "doctor", "detective", "faithful"].includes(roleLower)) {
            this.updateState({ currentRole: roleLower });
          }
        }
        this.syncPlayers(data.players || []);
        if (data.phase_ends_at || typeof data.timer_seconds === "number") {
          this.serverPhaseEndsAt = Number(data.phase_ends_at) || 0;
          const remaining = this.serverPhaseEndsAt
            ? Math.max(0, Math.ceil(this.serverPhaseEndsAt - Date.now() / 1000))
            : 0;
          this.updateState({
            timerSeconds: remaining,
            roundNumber: data.round_number || this.state.roundNumber,
            serverPhase: data.phase || this.state.serverPhase,
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
            if (nextPhase === "MORNING" || nextPhase === "DISCUSSION") {
              this.updateState({ allActionsResolved: true, isTimeUp: true });
            }
            if (nextPhase === "NIGHT" && packet.payload?.phase_ends_at) {
              this.serverPhaseEndsAt = Number(packet.payload.phase_ends_at) || 0;
              this.updateState({ timerSeconds: Math.max(0, Math.ceil(this.serverPhaseEndsAt - Date.now() / 1000)), isTimeUp: false });
              this.startCountdown();
            }
            if (packet.payload?.players) {
              this.syncPlayers(packet.payload.players);
            }
          } else if (packet.type === "INITIAL_SYNC" && packet.payload) {
            if (packet.payload.phase) this.updateState({ serverPhase: packet.payload.phase });
            if (packet.payload.players) {
              this.syncPlayers(packet.payload.players);
            }
            if (packet.payload.viewer_role && packet.payload.viewer_role !== "Unknown") {
              const roleLower = packet.payload.viewer_role.toLowerCase() as GameRole;
              if (["traitor", "doctor", "detective", "faithful"].includes(roleLower)) {
                this.updateState({ currentRole: roleLower });
                this.syncPlayers(packet.payload.players || this.serverPlayers);
              }
            }
            if (packet.payload.phase_ends_at || typeof packet.payload.timer_seconds === "number") {
              this.serverPhaseEndsAt = Number(packet.payload.phase_ends_at) || 0;
              const remaining = this.serverPhaseEndsAt
                ? Math.max(0, Math.ceil(this.serverPhaseEndsAt - Date.now() / 1000))
                : 0;
              this.updateState({ timerSeconds: remaining, hasSynced: true });
              if (remaining > 0 && packet.payload.phase === "NIGHT") this.startCountdown();
            }
          }
        } catch {
          // ignore
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
          this.reconnectTimer = setTimeout(async () => {
            await this.fetchInitialState();
            if (!this.disposed) this.initWebSocket();
          }, 1500);
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

  public getState(): NightPhaseState {
    return this.state;
  }

  public subscribe(listener: (state: NightPhaseState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<NightPhaseState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((cb) => cb(this.state));
  }

  // Get eligible targets (living players excluding self)
  public getEligibleTargets(): NightPlayerTarget[] {
    if (this.state.targets && this.state.targets.length > 0) {
      return this.state.targets;
    }
    return this.computeTargets();
  }

  public getAllPlayers(): any[] {
    return this.state.allPlayers || [];
  }

  public selectTarget(targetId: string) {
    if (this.state.isSubmitted || this.state.currentRole === "faithful") return;
    this.updateState({ selectedTargetId: targetId });
  }

  public async submitAction(): Promise<{ success: boolean; message: string }> {
    if (!this.state.selectedTargetId && this.state.currentRole !== "faithful") {
      return { success: false, message: "Please select a target first." };
    }

    const target = this.getEligibleTargets().find(
      (t) => t.id === this.state.selectedTargetId
    );
    const targetName = target ? target.name : null;

    let actionType = "KILL";
    const session = getPlayerSession(this.state.roomCode);
    if (this.state.currentRole === "doctor") actionType = "SAVE";
    else if (this.state.currentRole === "detective") actionType = "INVESTIGATE";

    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/v1/game/${this.state.roomCode}/night-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: this.state.currentUserId,
          roundNumber: this.state.roundNumber,
          actionType: actionType,
          targetId: this.state.selectedTargetId || "none",
          token: session.token, account_token: session.accountToken,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        return { success: false, message: result.message || "Night action was rejected." };
      }
      if (result.investigationResult) {
        this.updateState({ investigationResult: {
          targetName: result.investigationResult.targetName,
          isTraitor: result.investigationResult.isTraitor,
        } });
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
      message: "Action recorded successfully.",
    };
  }

  public switchRole(newRole: GameRole) {
    // The role is secret and comes from the authenticated backend session.
  }

  public resetAction() {
    this.updateState({
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
