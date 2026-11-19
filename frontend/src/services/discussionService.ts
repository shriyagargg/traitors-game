import {
  DiscussionPlayer,
  DiscussionMessage,
  ArchitectAnnouncement,
  DiscussionState,
} from "@/types/discussion";
import { getApiBaseUrl, getWsBaseUrl } from "./rooms";
import { getPlayerSession, ensureRoomSession } from "./playerSession";

export const INITIAL_ARCHITECT_ANNOUNCEMENT: ArchitectAnnouncement = {
  id: "ann_architect",
  title: "The Architect",
  message:
    "The night has concluded. The Council now convenes in the Great Hall. Speak your truths and observe your peers.",
};

export class DiscussionService {
  private state: DiscussionState;
  private listeners: Set<(state: DiscussionState) => void> = new Set();
  private timerInterval: NodeJS.Timeout | null = null;
  private socket: WebSocket | null = null;
  private disposed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private serverPhaseEndsAt: number = 0;

  constructor(roomCode = "", roundNumber = 1) {
    const session = getPlayerSession(roomCode);

    this.state = {
      roomCode: roomCode.toUpperCase(),
      roundNumber: roundNumber,
      phaseName: "Discussion",
      phaseType: "Day",
      timerSeconds: 0,
      announcement: { ...INITIAL_ARCHITECT_ANNOUNCEMENT },
      players: [],
      messages: [],
      connectionStatus: "disconnected",
      hasSynced: false,
    };

    void this.init();
    this.startCountdown();
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
      // 1. Fetch game state
      const res = await fetch(
        `${apiUrl}/api/v1/game/${this.state.roomCode}/state?player_id=${session.id}&token=${encodeURIComponent(session.token || "")}&account_token=${encodeURIComponent(session.accountToken || "")}`
      );
      if (res.ok) {
        const data = await res.json();
        this.syncState(data, session.id);
      }

      // 2. Fetch chat history
      const msgRes = await fetch(`${apiUrl}/api/v1/game/${this.state.roomCode}/messages?player_id=${encodeURIComponent(session.id)}&token=${encodeURIComponent(session.token || "")}&account_token=${encodeURIComponent(session.accountToken || "")}`);
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        if (msgData.messages && Array.isArray(msgData.messages)) {
          this.updateState({ messages: msgData.messages });
        }
      }
    } catch {
      // Offline fallback
    }
  }

  private syncState(data: any, currentUserId: string) {
    if (!data || !data.players) return;

    const mappedPlayers: DiscussionPlayer[] = data.players.map((p: any) => ({
      id: p.id,
      name: p.name,
      avatarUrl: p.avatar_url || p.avatarUrl || "",
      isAlive: p.is_alive ?? (p.status === "ALIVE"),
      isHost: p.is_host ?? false,
      isCurrentUser: p.id === currentUserId,
      isMuted: false,
    }));

    if (data.phase_ends_at || typeof data.timer_seconds === "number") {
      this.serverPhaseEndsAt = Number(data.phase_ends_at) || 0;
      const remaining = this.serverPhaseEndsAt
        ? Math.max(0, Math.ceil(this.serverPhaseEndsAt - Date.now() / 1000))
        : 0;
      this.updateState({
        timerSeconds: remaining,
        roundNumber: data.round_number || this.state.roundNumber,
      });
      // Re-arm the display from the server deadline after initial sync,
      // reconnect, or a phase update. The client never owns the deadline.
      this.startCountdown();
    }

    const announcementText =
      data.architect_announcement || INITIAL_ARCHITECT_ANNOUNCEMENT.message;

    this.updateState({
      players: mappedPlayers,
      roundNumber: data.round_number || this.state.roundNumber,
      serverPhase: data.phase || this.state.serverPhase,
      announcement: {
        ...this.state.announcement,
        message: announcementText,
      },
      connectionStatus: "connected",
      hasSynced: true,
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
          } else if (packet.type === "PHASE_CHANGED") {
            const nextPhase = packet.payload?.phase;
            if (packet.payload) this.syncState(packet.payload, session.id);
            else if (nextPhase) this.updateState({ serverPhase: nextPhase });
          } else if (
            (packet.type === "DISCUSSION_MESSAGE" || packet.type === "CHAT_MESSAGE") &&
            packet.payload
          ) {
            const incoming: DiscussionMessage = {
              id: packet.payload.id || `msg_${Date.now()}`,
              senderId: packet.payload.senderId,
              senderName: packet.payload.senderName,
              avatarUrl: packet.payload.avatarUrl || "",
              timestamp: packet.payload.timestamp || "Now",
              text: packet.payload.text || packet.payload.content || "",
              isArchitect: packet.payload.isArchitect || false,
              isAI: packet.payload.isAI || false,
            };

            // Avoid duplicate by ID
            if (!this.state.messages.some((m) => m.id === incoming.id)) {
              this.updateState({
                messages: [...this.state.messages, incoming],
              });
            }
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

  public getState(): DiscussionState {
    return this.state;
  }

  public subscribe(listener: (state: DiscussionState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<DiscussionState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((cb) => cb(this.state));
  }

  public async reinit(roomCode: string) {
    if (!roomCode || roomCode === this.state.roomCode) return;
    this.state.roomCode = roomCode.toUpperCase();
    await this.init();
  }

  public async sendMessage(text: string): Promise<{ success: boolean; message?: string }> {
    const clean = text.trim();
    if (!clean) return { success: false, message: "Write a message first." };

    const session = getPlayerSession(this.state.roomCode);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/game/${this.state.roomCode}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: session.id,
          content: clean,
          phase: "DISCUSSION",
          roundNumber: this.state.roundNumber,
          token: session.token,
          account_token: session.accountToken,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        return { success: false, message: result.detail || result.message || "Message was rejected." };
      }
      // The API persists then broadcasts. If this client is reconnecting, add
      // its acknowledged message locally; the id check prevents WS duplicates.
      const payload = result.message;
      if (payload?.id && !this.state.messages.some((m) => m.id === payload.id)) {
        this.updateState({ messages: [...this.state.messages, {
          id: payload.id,
          senderId: payload.senderId,
          senderName: payload.senderName,
          avatarUrl: payload.avatarUrl || "",
          timestamp: payload.timestamp || "Now",
          text: payload.text || payload.content || clean,
          isArchitect: payload.isArchitect || false,
          isAI: payload.isAI || false,
        }] });
      }
      return { success: true };
    } catch {
      return { success: false, message: "Could not reach the game server. Please retry." };
    }
  }

  public async consultArchitect(query: string): Promise<{ success: boolean; answer?: string; message?: string }> {
    const clean = query.trim();
    if (!clean) return { success: false, message: "Ask the Architect a question first." };
    let session = getPlayerSession(this.state.roomCode);
    if (!session.token && session.accountToken) {
      session = await ensureRoomSession(this.state.roomCode);
    }
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/game/${encodeURIComponent(this.state.roomCode)}/architect-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: session.id,
          token: session.token,
          account_token: session.accountToken,
          message: clean,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success || typeof result.answer !== "string") {
        return { success: false, message: result.detail || "The Architect could not answer. Please try again." };
      }
      return { success: true, answer: result.answer };
    } catch {
      return { success: false, message: "Could not connect to the Architect service. Check the backend connection and try again." };
    }
  }

  public togglePlayerStatus(playerId: string) {
    const updated = this.state.players.map((p) =>
      p.id === playerId ? { ...p, isAlive: !p.isAlive } : p
    );
    this.updateState({ players: updated });
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
