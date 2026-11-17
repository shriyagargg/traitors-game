import {
  DiscussionPlayer,
  DiscussionMessage,
  ArchitectAnnouncement,
  DiscussionState,
} from "@/types/discussion";
import { getApiBaseUrl, getWsBaseUrl } from "./rooms";
import { getPlayerSession } from "./playerSession";

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

  constructor(roomCode = "A7K4D9", roundNumber = 1) {
    const session = getPlayerSession(roomCode);

    this.state = {
      roomCode: roomCode.toUpperCase(),
      roundNumber: roundNumber,
      phaseName: "Discussion",
      phaseType: "Day",
      timerSeconds: 120,
      announcement: { ...INITIAL_ARCHITECT_ANNOUNCEMENT },
      players: [],
      messages: [],
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
      // 1. Fetch game state
      const res = await fetch(
        `${apiUrl}/api/v1/game/${this.state.roomCode}/state?player_id=${session.id}&token=${encodeURIComponent(session.token || "")}`
      );
      if (res.ok) {
        const data = await res.json();
        this.syncState(data, session.id);
      }

      // 2. Fetch chat history
      const msgRes = await fetch(`${apiUrl}/api/v1/game/${this.state.roomCode}/messages`);
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
      avatarUrl: p.avatar_url || p.avatarUrl || "/images/player_somya.png",
      isAlive: p.is_alive ?? (p.status === "ALIVE"),
      isHost: p.is_host ?? false,
      isCurrentUser: p.id === currentUserId,
      isMuted: false,
    }));

    if (data.phase_ends_at) {
      this.serverPhaseEndsAt = data.phase_ends_at;
      const remaining = Math.max(0, Math.floor(data.phase_ends_at - Date.now() / 1000));
      this.updateState({
        timerSeconds: remaining,
        roundNumber: data.round_number || this.state.roundNumber,
      });
    }

    const announcementText =
      data.architect_announcement || INITIAL_ARCHITECT_ANNOUNCEMENT.message;

    this.updateState({
      players: mappedPlayers,
      roundNumber: data.round_number || this.state.roundNumber,
      announcement: {
        ...this.state.announcement,
        message: announcementText,
      },
      connectionStatus: "connected",
    });
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
        void this.fetchInitialState();
      };

      ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          if (packet.type === "INITIAL_SYNC" && packet.payload) {
            this.syncState(packet.payload, session.id);
          } else if (packet.type === "PHASE_CHANGED") {
            const nextPhase = packet.payload?.phase;
            if (nextPhase === "VOTING") {
              this.updateState({ isTimeUp: true, timerSeconds: 0 });
            } else if (packet.payload) {
              this.syncState(packet.payload, session.id);
            }
          } else if (
            (packet.type === "DISCUSSION_MESSAGE" || packet.type === "CHAT_MESSAGE") &&
            packet.payload
          ) {
            const incoming: DiscussionMessage = {
              id: packet.payload.id || `msg_${Date.now()}`,
              senderId: packet.payload.senderId,
              senderName: packet.payload.senderName,
              avatarUrl: packet.payload.avatarUrl || "/images/player_somya.png",
              timestamp: packet.payload.timestamp || "Now",
              text: packet.payload.text || packet.payload.content || "",
              isArchitect: packet.payload.isArchitect || false,
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
    this.updateState({ timerSeconds: 0, isTimeUp: true });
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

  public async sendMessage(text: string) {
    const clean = text.trim();
    if (!clean) return;

    const session = getPlayerSession(this.state.roomCode);
    // Send via WebSocket
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: "DISCUSSION_MESSAGE",
          payload: {
            senderId: session.id,
            senderName: session.name,
            avatarUrl: session.avatarUrl,
            content: clean,
          },
        })
      );
    } else {
      // Fallback REST
      try {
        const apiUrl = getApiBaseUrl();
        await fetch(`${apiUrl}/api/v1/game/${this.state.roomCode}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: session.id,
            senderName: session.name,
            avatarUrl: session.avatarUrl,
            content: clean,
            phase: "DISCUSSION",
            roundNumber: this.state.roundNumber,
            token: session.token,
          }),
        });
      } catch {
        // ignore
      }
    }
  }

  public togglePlayerStatus(playerId: string) {
    const updated = this.state.players.map((p) =>
      p.id === playerId ? { ...p, isAlive: !p.isAlive } : p
    );
    this.updateState({ players: updated });
  }

  public resetTimer() {
    this.updateState({ timerSeconds: 120 });
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
