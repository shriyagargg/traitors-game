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
import { getPlayerSession } from "./playerSession";

export class LobbyService {
  private state: LobbyRoomState;
  private listeners: Set<(state: LobbyRoomState) => void> = new Set();
  private socket: WebSocket | null = null;
  private pingInterval: any = null;
  private roomCode: string;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyClosed = false;

  constructor(
    roomCode = "A7K4D9",
    initialRoomName = "Council Chamber",
    initialCapacity: PlayerCapacity = 8,
    isPrivate = false
  ) {
    this.roomCode = roomCode.toUpperCase();
    const session = getPlayerSession(this.roomCode);

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

    this.fetchInitialState();
    this.initWebSocket();
  }

  private async fetchInitialState() {
    if (typeof window === "undefined") return;
    const session = getPlayerSession(this.roomCode);
    const apiUrl = getApiBaseUrl();

    try {
      const res = await fetch(
        `${apiUrl}/api/v1/game/${this.roomCode}/state?player_id=${session.id}&token=${encodeURIComponent(session.token || "")}`
      );
      if (res.ok) {
        const data = await res.json();
        this.syncFromServerState(data, session.id);
      }
      const messagesRes = await fetch(`${apiUrl}/api/v1/game/${this.roomCode}/messages`);
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
    if (typeof window === "undefined") return;
    const session = getPlayerSession(this.roomCode);
    const wsUrl = `${getWsBaseUrl()}/api/v1/ws/game/${this.roomCode}?player_id=${session.id}&token=${encodeURIComponent(session.token || "")}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        this.manuallyClosed = false;
        this.socket = ws;
        this.updateState({ connectionStatus: "connected" });
        void this.fetchInitialState();

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

      ws.onclose = () => {
        this.socket = null;
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.updateState({ connectionStatus: "disconnected" });
        if (!this.manuallyClosed) {
          this.reconnectTimer = setTimeout(() => this.initWebSocket(), 1500);
        }
      };
    } catch {
      this.updateState({ connectionStatus: "mock_preview" });
    }
  }

  private syncFromServerState(data: any, currentUserId: string) {
    if (!data || !data.players) return;

    const mappedPlayers: LobbyPlayer[] = data.players.map((p: any, idx: number) => ({
      id: p.id,
      name: p.name,
      avatarUrl: p.avatar_url || p.avatarUrl || "/images/player_somya.png",
      isHost: p.is_host ?? (data.host_id ? p.id === data.host_id : idx === 0),
      isReady: p.is_ready ?? true,
      isCurrentUser: p.id === currentUserId,
      isConnected: p.is_connected !== false,
      slotIndex: p.slot_index ?? idx,
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
        if (event.payload?.players) {
          const mapped = event.payload.players.map((p: any, idx: number) => ({
            id: p.id,
            name: p.name,
            avatarUrl: p.avatarUrl || p.avatar_url || "/images/player_somya.png",
            isHost: p.isHost ?? (idx === 0),
            isReady: p.isReady ?? false,
            isCurrentUser: p.id === currentUserId,
            isConnected: p.isConnected ?? p.is_connected ?? true,
            slotIndex: p.slotIndex ?? idx,
          }));
          this.updateState({ players: mapped });
        }
        break;

      case "READY_TOGGLE":
        if (event.payload?.players) {
          const mapped = event.payload.players.map((p: any, idx: number) => ({
            id: p.id,
            name: p.name,
            avatarUrl: p.avatarUrl || p.avatar_url || "/images/player_somya.png",
            isHost: p.isHost ?? (idx === 0),
            isReady: p.isReady,
            isCurrentUser: p.id === currentUserId,
            isConnected: p.isConnected ?? p.is_connected ?? true,
            slotIndex: p.slotIndex ?? idx,
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
          this.updateState({
            messages: [...this.state.messages, newMsg],
          });
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
    this.updateState({ players: updated });

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
        await fetch(`${apiUrl}/api/v1/game/${this.roomCode}/ready`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ player_id: targetId, token: session.token }),
        });
      } catch {
        // ignore
      }
    }
  }

  public async sendChatMessage(text: string) {
    const clean = text.trim();
    if (!clean) return;

    const session = getPlayerSession(this.roomCode);
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: "CHAT_MESSAGE",
          payload: {
            senderId: session.id,
            senderName: session.name,
            avatarUrl: session.avatarUrl,
            content: clean,
            token: session.token,
          },
        })
      );
    } else {
      try {
        const apiUrl = getApiBaseUrl();
        await fetch(`${apiUrl}/api/v1/game/${this.roomCode}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: session.id,
            senderName: session.name,
            avatarUrl: session.avatarUrl,
            content: clean,
            token: session.token,
          }),
        });
      } catch {
        // ignore
      }
    }
  }

  public async startGame(): Promise<{ success: boolean; message: string }> {
    const session = getPlayerSession(this.roomCode);
    const apiUrl = getApiBaseUrl();

    try {
      const res = await fetch(
        `${apiUrl}/api/v1/game/${this.roomCode}/start?host_id=${session.id}&token=${encodeURIComponent(session.token || "")}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (res.ok) {
        this.updateState({ status: "playing" });
        return { success: true, message: "Game started." };
      } else {
        const err = await res.json().catch(() => ({ detail: "Failed to start game." }));
        return { success: false, message: err.detail || "Cannot start game." };
      }
    } catch {
      return { success: false, message: "Server connection failed." };
    }
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
