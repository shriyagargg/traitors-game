/**
 * AI TRAITORS — Multiplayer Lobby Service & Real-Time Sync Adapter
 * Fully wired to FastAPI WebSocket & REST endpoints for real multiplayer gameplay.
 */

import {
  LobbyPlayer,
  LobbySettings,
  LobbyChatMessage,
  LobbyRoomState,
} from "@/types/lobby";
import { PlayerCapacity, getApiBaseUrl, getWsBaseUrl } from "./rooms";
import { getPlayerSession, ensureRoomSession } from "./playerSession";

export class LobbyService {
  private state: LobbyRoomState;
  private listeners: Set<(state: LobbyRoomState) => void> = new Set();
  private socket: WebSocket | null = null;
  private pingInterval: any = null;
  private roomCode: string;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyClosed = false;
  private authRejected = false;

  constructor(
    roomCode = "",
    initialRoomName = "Council Chamber",
    initialCapacity: PlayerCapacity = 8,
    isPrivate = false
  ) {
    this.roomCode = roomCode.toUpperCase();

    this.state = {
      roomCode: this.roomCode,
      roomName: initialRoomName,
      isPrivate: isPrivate,
      hostId: "",
      settings: {
        playerCapacity: initialCapacity,
        nightDuration: 30,
        discussionDuration: 120,
        votingDuration: 60,
        isPrivate: isPrivate,
        roomName: initialRoomName,
      },
      players: [],
      messages: [],
      status: "waiting",
      connectionStatus: "connecting",
    };

    void this.init();
  }

  private async init() {
    if (typeof window === "undefined") return;
    let session = getPlayerSession(this.roomCode);
    if (!session.token && session.accountToken) {
      session = await ensureRoomSession(this.roomCode);
    }
    await this.fetchInitialState();
    this.initWebSocket();
  }

  private async fetchInitialState() {
    if (typeof window === "undefined") return;
    const session = getPlayerSession(this.roomCode);
    const apiUrl = getApiBaseUrl();

    try {
      const res = await fetch(
        `${apiUrl}/api/v1/game/${this.roomCode}/state?player_id=${session.id}&token=${encodeURIComponent(session.token || "")}&account_token=${encodeURIComponent(session.accountToken || "")}`
      );
      if (res.ok) {
        const data = await res.json();
        this.syncFromServerState(data, session.id);
      }
      const messagesRes = await fetch(`${apiUrl}/api/v1/game/${this.roomCode}/messages?player_id=${encodeURIComponent(session.id)}&token=${encodeURIComponent(session.token || "")}&account_token=${encodeURIComponent(session.accountToken || "")}`);
      if (messagesRes.ok) {
        const data = await messagesRes.json();
        this.updateState({ messages: (data.messages || []).map((m: any) => ({
          id: m.id, senderId: m.senderId, senderName: m.senderName,
          text: m.text || m.content, timestamp: m.timestamp, isSystem: m.isSystem,
        })) });
      }
    } catch {
      // Backend starting or offline
    }
  }

  private initWebSocket() {
    if (typeof window === "undefined" || this.authRejected) return;
    const session = getPlayerSession(this.roomCode);
    if (!session.token) {
      return;
    }
    const wsUrl = `${getWsBaseUrl()}/api/v1/ws/game/${this.roomCode}?player_id=${session.id}&token=${encodeURIComponent(session.token || "")}&account_token=${encodeURIComponent(session.accountToken || "")}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        this.manuallyClosed = false;
        this.socket = ws;
        this.updateState({ connectionStatus: "connected" });

        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "PING" }));
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          this.handleIncomingEvent(packet, session.id);
        } catch {
          // ignore corrupted packets
        }
      };

      ws.onerror = () => {
        this.updateState({ connectionStatus: "disconnected" });
      };

      ws.onclose = (event) => {
        this.socket = null;
        if (event.code === 4404 || event.code === 4401) { this.authRejected = true; this.updateState({ connectionStatus: "disconnected" }); return; }
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.updateState({ connectionStatus: "disconnected" });
        if (!this.manuallyClosed) {
          this.reconnectTimer = setTimeout(async () => {
            await this.fetchInitialState();
            if (!this.manuallyClosed) this.initWebSocket();
          }, 1500);
        }
      };
    } catch {
      this.updateState({ connectionStatus: "disconnected" });
    }
  }

  private syncFromServerState(data: any, currentUserId: string) {
    if (!data || !data.players) return;

    const mappedPlayers: LobbyPlayer[] = data.players.map((p: any, idx: number) => ({
      id: p.id,
      name: p.name,
      avatarUrl: p.avatar_url || p.avatarUrl || "",
      isHost: p.is_host ?? (data.host_id ? p.id === data.host_id : idx === 0),
      isReady: p.is_ready ?? true,
      isCurrentUser: p.id === currentUserId,
      isConnected: p.is_connected !== false,
      slotIndex: p.slot_index ?? idx,
      isAI: p.is_ai ?? p.isAI ?? false,
    }));

    this.updateState({
      roomName: data.room_name || this.state.roomName,
      hostId: data.host_id || this.state.hostId,
      players: mappedPlayers,
      status: data.phase !== "LOBBY" ? "playing" : "waiting",
      settings: {
        ...this.state.settings,
        playerCapacity: (data.capacity as PlayerCapacity) || this.state.settings.playerCapacity,
        roomName: data.room_name || this.state.settings.roomName,
      },
    });
  }

  private handleIncomingEvent(event: any, currentUserId: string) {
    switch (event.type) {
      case "INITIAL_SYNC":
      case "STATE_UPDATE":
        this.syncFromServerState(event.payload, currentUserId);
        break;

      case "PLAYER_JOIN":
      case "PLAYER_JOINED":
      case "PLAYERS_UPDATED":
        if (event.payload?.players) {
          const mapped = event.payload.players.map((p: any, idx: number) => ({
            id: p.id,
            name: p.name,
            avatarUrl: p.avatarUrl || p.avatar_url || "",
            isHost: p.isHost ?? (idx === 0),
            isReady: p.isReady ?? false,
            isCurrentUser: p.id === currentUserId,
            isConnected: p.isConnected ?? p.is_connected ?? true,
            slotIndex: p.slotIndex ?? idx,
            isAI: p.isAI ?? p.is_ai ?? false,
          }));
          this.updateState({ players: mapped });
        }
        break;

      case "PLAYER_LEFT":
        if (event.payload?.players) {
          const mapped = event.payload.players.map((p: any, idx: number) => ({
            id: p.id,
            name: p.name,
            avatarUrl: p.avatarUrl || p.avatar_url || "",
            isHost: p.isHost ?? (idx === 0),
            isReady: p.isReady ?? false,
            isCurrentUser: p.id === currentUserId,
            isConnected: p.isConnected ?? p.is_connected ?? true,
            slotIndex: p.slotIndex ?? idx,
            isAI: p.isAI ?? p.is_ai ?? false,
          }));
          this.updateState({
            players: mapped,
            hostId: event.payload.newHostId || this.state.hostId,
          });
        } else if (event.payload?.playerId) {
          this.updateState({
            players: this.state.players.filter((p) => p.id !== event.payload.playerId),
            hostId: event.payload.newHostId || this.state.hostId,
          });
        }
        break;

      case "READY_TOGGLE":
        if (event.payload?.players) {
          const mapped = event.payload.players.map((p: any, idx: number) => ({
            id: p.id,
            name: p.name,
            avatarUrl: p.avatarUrl || p.avatar_url || "",
            isHost: p.isHost ?? (idx === 0),
            isReady: p.isReady,
            isCurrentUser: p.id === currentUserId,
            isConnected: p.isConnected ?? p.is_connected ?? true,
            slotIndex: p.slotIndex ?? idx,
            isAI: p.isAI ?? p.is_ai ?? false,
          }));
          this.updateState({ players: mapped });
        } else if (event.payload?.playerId) {
          const updated = this.state.players.map((p) =>
            p.id === event.payload.playerId ? { ...p, isReady: event.payload.isReady } : p
          );
          this.updateState({ players: updated });
        }
        break;

      case "CHAT_MESSAGE":
      case "DISCUSSION_MESSAGE":
        if (event.payload) {
          const newMsg: LobbyChatMessage = {
            id: event.payload.id || `msg_${Date.now()}`,
            senderId: event.payload.senderId,
            senderName: event.payload.senderName,
            text: event.payload.text || event.payload.content || "",
            timestamp: event.payload.timestamp || "Now",
            isSystem: event.payload.isSystem || false,
          };
          if (!this.state.messages.some((message) => message.id === newMsg.id)) {
            this.updateState({ messages: [...this.state.messages, newMsg] });
          }
        }
        break;

      case "GAME_STARTED":
      case "PHASE_CHANGED":
        this.updateState({ status: "playing" });
        break;

      case "PLAYER_DISCONNECTED":
      case "PLAYER_RECONNECTED":
        if (event.payload?.state) this.syncFromServerState(event.payload.state, currentUserId);
        if (event.payload?.playerId) {
          const connected = event.type === "PLAYER_RECONNECTED";
          this.updateState({ players: this.state.players.map((p) =>
            p.id === event.payload.playerId ? { ...p, isConnected: connected } : p
          ) });
        }
        break;

      default:
        break;
    }
  }

  public getState(): LobbyRoomState {
    return this.state;
  }

  public subscribe(listener: (state: LobbyRoomState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<LobbyRoomState>) {
    this.state = {
      ...this.state,
      ...partial,
      settings: {
        ...this.state.settings,
        ...(partial.settings || {}),
      },
    };
    this.listeners.forEach((cb) => cb(this.state));
  }

  public async toggleReady(playerId?: string) {
    const session = getPlayerSession(this.roomCode);
    const targetId = playerId || session.id;

    const updated = this.state.players.map((p) =>
      p.id === targetId ? { ...p, isReady: !p.isReady } : p
    );

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: "READY_TOGGLE",
          payload: { playerId: targetId },
        })
      );
    } else {
      try {
        const apiUrl = getApiBaseUrl();
        const response = await fetch(`${apiUrl}/api/v1/game/${this.roomCode}/ready`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ player_id: targetId, token: session.token, account_token: session.accountToken }),
        });
        if (!response.ok) throw new Error("Ready update failed");
        this.updateState({ players: updated });
      } catch {
        // Server state remains authoritative; the next sync updates the lobby.
      }
    }
  }

  public async sendChatMessage(text: string): Promise<{ success: boolean; message?: string }> {
    const clean = text.trim();
    if (!clean) return { success: false, message: "Write a message first." };

    const session = getPlayerSession(this.roomCode);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/game/${this.roomCode}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: session.id, content: clean, token: session.token, account_token: session.accountToken }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) return { success: false, message: result.detail || result.message || "Message was rejected." };
      const message = result.message;
      if (message?.id && !this.state.messages.some((item) => item.id === message.id)) {
        this.updateState({ messages: [...this.state.messages, {
          id: message.id,
          senderId: message.senderId,
          senderName: message.senderName,
          text: message.text || message.content || clean,
          timestamp: message.timestamp || "Now",
          isSystem: Boolean(message.isSystem),
        }] });
      }
      return { success: true };
    } catch {
      return { success: false, message: "Could not reach the game server." };
    }
  }

  public async startGame(): Promise<{ success: boolean; message: string }> {
    const session = getPlayerSession(this.roomCode);
    const apiUrl = getApiBaseUrl();

    try {
      const res = await fetch(
        `${apiUrl}/api/v1/game/${this.roomCode}/start`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ host_id: session.id, token: session.token, account_token: session.accountToken }) }
      );

      if (res.ok) {
        return { success: true, message: "Game started." };
      } else {
        const err = await res.json().catch(() => ({ detail: "Failed to start game." }));
        return { success: false, message: err.detail || "Cannot start game." };
      }
    } catch {
      return { success: false, message: "Server connection failed." };
    }
  }

  public async addTestPlayers(count?: number): Promise<{ success: boolean; message: string }> {
    const session = getPlayerSession(this.roomCode);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/game/${this.roomCode}/test-players`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accountToken || ""}` },
        body: JSON.stringify(count ? { count } : {}),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return { success: false, message: data.detail || "Could not add test players." };
      this.syncFromServerState(await this.fetchStateData(), session.id);
      return { success: true, message: `Added ${data.added} test player${data.added === 1 ? "" : "s"}.` };
    } catch {
      return { success: false, message: "Could not connect to the game server." };
    }
  }

  public async removeTestPlayer(playerId: string): Promise<{ success: boolean; message: string }> {
    const session = getPlayerSession(this.roomCode);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/game/${this.roomCode}/test-players/${encodeURIComponent(playerId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.accountToken || ""}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return { success: false, message: data.detail || "Could not remove test player." };
      this.syncFromServerState(await this.fetchStateData(), session.id);
      return { success: true, message: "Test player removed." };
    } catch {
      return { success: false, message: "Could not connect to the game server." };
    }
  }

  private async fetchStateData(): Promise<any> {
    const session = getPlayerSession(this.roomCode);
    const response = await fetch(`${getApiBaseUrl()}/api/v1/game/${this.roomCode}/state?player_id=${encodeURIComponent(session.id)}&token=${encodeURIComponent(session.token || "")}&account_token=${encodeURIComponent(session.accountToken || "")}`);
    if (!response.ok) throw new Error("Lobby state refresh failed");
    return response.json();
  }

  public updateSettings(partialSettings: Partial<LobbySettings>) {
    this.updateState({
      settings: {
        ...this.state.settings,
        ...partialSettings,
      },
      roomName: partialSettings.roomName || this.state.roomName,
      isPrivate: partialSettings.isPrivate ?? this.state.isPrivate,
    });
  }

  public updateRoomName(newName: string) {
    const clean = newName.trim();
    if (!clean) return;
    this.updateState({
      roomName: clean,
      settings: { ...this.state.settings, roomName: clean },
    });
  }

  public validateGameStart(): {
    canStart: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    const count = this.state.players.length;

    if (count < 4) {
      reasons.push(`Chamber requires at least 4 players (currently ${count}).`);
    }

    const unreadyPlayers = this.state.players.filter((p) => !p.isReady);
    if (unreadyPlayers.length > 0) {
      const names = unreadyPlayers.map((p) => p.name).join(", ");
      reasons.push(`All players must be Ready. Unready: ${names}.`);
    }

    return {
      canStart: reasons.length === 0,
      reasons,
    };
  }

  public async leaveLobby(): Promise<{ success: boolean; message: string }> {
    const session = getPlayerSession(this.roomCode);
    const apiUrl = getApiBaseUrl();

    try {
      const res = await fetch(`${apiUrl}/api/v1/game/${this.roomCode}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: session.id,
          token: session.token,
          account_token: session.accountToken,
        }),
      });

      this.disconnect();
      if (res.ok) {
        return { success: true, message: "Left lobby." };
      } else {
        const err = await res.json().catch(() => ({ detail: "Failed to leave lobby." }));
        return { success: false, message: err.detail || "Cannot leave lobby." };
      }
    } catch {
      this.disconnect();
      return { success: true, message: "Disconnected from lobby." };
    }
  }

  public disconnect() {
    this.manuallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}
