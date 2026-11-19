import {
  MorningPlayer,
  MorningAnnouncementState,
} from "@/types/morningAnnouncement";
import { getApiBaseUrl, getWsBaseUrl } from "./rooms";
import { getPlayerSession, ensureRoomSession } from "./playerSession";

export class MorningService {
  private state: MorningAnnouncementState;
  private listeners: Set<(state: MorningAnnouncementState) => void> = new Set();
  private socket: WebSocket | null = null;
  private disposed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private timerInterval: NodeJS.Timeout | null = null;
  private serverPhaseEndsAt: number = 0;

  constructor(roomCode = "", roundNumber = 1) {
    this.state = {
      roomCode: roomCode.toUpperCase(),
      roundNumber: roundNumber,
      phaseType: "Day",
      eliminatedPlayer: null,
      players: [],
      roleRevealPermitted: false,
      connectionStatus: "disconnected",
      dynamicAnnouncement: null,
    };

    void this.init();
  }

  public async reinit(roomCode: string) {
    if (!roomCode || roomCode === this.state.roomCode) return;
    this.state.roomCode = roomCode.toUpperCase();
    await this.init();
  }

  private async init() {
    if (typeof window === "undefined") return;
    let session = getPlayerSession(this.state.roomCode);
    if (!session.token && session.accountToken) {
      session = await ensureRoomSession(this.state.roomCode);
    }
    await this.fetchInitialState();
    this.initWebSocket();
  }

  private async fetchInitialState() {
    if (typeof window === "undefined") return;
    let session = getPlayerSession(this.state.roomCode);
    if (!session.token && session.accountToken) {
      session = await ensureRoomSession(this.state.roomCode);
    }
    const apiUrl = getApiBaseUrl();

    try {
      const res = await fetch(
        `${apiUrl}/api/v1/game/${this.state.roomCode}/state?player_id=${session.id}&token=${encodeURIComponent(session.token || "")}&account_token=${encodeURIComponent(session.accountToken || "")}`
      );
      if (res.ok) {
        const data = await res.json();
        this.syncState(data, session.id);
      }
    } catch {
      // Backend starting
    }
  }

  private syncState(data: any, currentUserId: string) {
    if (!data || !data.players) return;

    const murderedId = data.murdered_player_id;
    const mappedPlayers: MorningPlayer[] = data.players.map((p: any) => ({
      id: p.id,
      name: p.name,
      avatarUrl: p.avatar_url || p.avatarUrl || "",
      isAlive: p.is_alive ?? (p.status === "ALIVE"),
      isEliminatedTonight: murderedId ? p.id === murderedId : false,
      isHost: p.is_host ?? false,
      isCurrentUser: p.id === currentUserId,
    }));

    const eliminated = mappedPlayers.find((p) => p.isEliminatedTonight) || null;

    this.updateState({
      roundNumber: data.round_number || this.state.roundNumber,
      players: mappedPlayers,
      eliminatedPlayer: eliminated,
      dynamicAnnouncement: data.architect_announcement || null,
      connectionStatus: "connected",
    });
  }

  private initWebSocket() {
    if (typeof window === "undefined" || this.disposed) return;
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
          if (packet.type === "INITIAL_SYNC" && packet.payload) {
            this.syncState(packet.payload, session.id);
          } else if (packet.type === "PHASE_CHANGED" && packet.payload) {
            this.syncState(packet.payload, session.id);
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
          this.reconnectTimer = setTimeout(() => this.initWebSocket(), 1500);
        }
      };
    } catch {
      this.updateState({ connectionStatus: "disconnected" });
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

  public destroy() {
    this.disposed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
