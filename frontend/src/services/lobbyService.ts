/**
 * AI TRAITORS — Multiplayer Lobby Service & Real-Time Sync Adapter
 *
 * Implements a dual architecture:
 * 1. Live WebSocket connector (ready for backend /api/v1/ws/lobby/{roomCode})
 * 2. Typed local Mock Adapter adhering to identical contracts for preview & evaluation.
 */

import {
  LobbyPlayer,
  LobbySettings,
  LobbyChatMessage,
  LobbyRoomState,
  LobbyConnectionStatus,
  LobbyWSEvent,
} from "@/types/lobby";
import { PlayerCapacity } from "./rooms";

export const INITIAL_MOCK_PLAYERS: LobbyPlayer[] = [
  {
    id: "p_somya",
    name: "Somya",
    avatarUrl: "/images/player_somya.png",
    isHost: true,
    isReady: true,
    isCurrentUser: true,
    slotIndex: 0,
  },
  {
    id: "p_shubh",
    name: "Shubh",
    avatarUrl: "/images/player_shubh.png",
    isHost: false,
    isReady: true,
    isCurrentUser: false,
    slotIndex: 1,
  },
  {
    id: "p_pari",
    name: "Pari",
    avatarUrl: "/images/player_pari.png",
    isHost: false,
    isReady: true,
    isCurrentUser: false,
    slotIndex: 2,
  },
  {
    id: "p_arnav",
    name: "Arnav",
    avatarUrl: "/images/player_arnav.png",
    isHost: false,
    isReady: true,
    isCurrentUser: false,
    slotIndex: 3,
  },
  {
    id: "p_riya",
    name: "Riya",
    avatarUrl: "/images/player_riya.png",
    isHost: false,
    isReady: false, // In mockup Riya is Not Ready
    isCurrentUser: false,
    slotIndex: 4,
  },
  {
    id: "p_vivaan",
    name: "Vivaan",
    avatarUrl: "/images/player_vivaan.png",
    isHost: false,
    isReady: true,
    isCurrentUser: false,
    slotIndex: 5,
  },
];

export const INITIAL_MOCK_MESSAGES: LobbyChatMessage[] = [
  {
    id: "msg_1",
    senderId: "p_shubh",
    senderName: "Shubh",
    text: "Joined the room",
    timestamp: "2:14 PM",
    isSystem: true,
  },
  {
    id: "msg_2",
    senderId: "p_pari",
    senderName: "Pari",
    text: "Let's go! 🔥",
    timestamp: "2:15 PM",
  },
  {
    id: "msg_3",
    senderId: "p_arnav",
    senderName: "Arnav",
    text: "One more player!",
    timestamp: "2:16 PM",
  },
];

export class LobbyService {
  private state: LobbyRoomState;
  private listeners: Set<(state: LobbyRoomState) => void> = new Set();
  private socket: WebSocket | null = null;
  private isSimulated = true;

  constructor(
    roomCode = "A7K4D9",
    initialRoomName = "Somya's Game Room",
    initialCapacity: PlayerCapacity = 8,
    isPrivate = false
  ) {
    this.state = {
      roomCode: roomCode.toUpperCase(),
      roomName: initialRoomName,
      isPrivate: isPrivate,
      hostId: "p_somya",
      settings: {
        playerCapacity: initialCapacity,
        nightDuration: 60,
        discussionDuration: 180,
        votingDuration: 90,
        isPrivate: isPrivate,
        roomName: initialRoomName,
      },
      players: [...INITIAL_MOCK_PLAYERS],
      messages: [...INITIAL_MOCK_MESSAGES],
      status: "waiting",
      connectionStatus: "mock_preview",
    };

    // Attempt real WebSocket connection in background if available
    this.initWebSocket(roomCode);
  }

  private initWebSocket(roomCode: string) {
    if (typeof window === "undefined") return;

    try {
      const wsUrl =
        process.env.NEXT_PUBLIC_WS_URL ||
        `ws://localhost:8000/api/v1/ws/lobby/${roomCode}`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        this.socket = ws;
        this.isSimulated = false;
        this.updateState({ connectionStatus: "connected" });
      };

      ws.onmessage = (event) => {
        try {
          const wsEvent: LobbyWSEvent = JSON.parse(event.data);
          this.handleIncomingEvent(wsEvent);
        } catch {
          // ignore corrupted packets
        }
      };

      ws.onerror = () => {
        // Fallback gracefully to mock adapter
        this.socket = null;
        this.isSimulated = true;
        this.updateState({ connectionStatus: "mock_preview" });
      };

      ws.onclose = () => {
        this.socket = null;
        this.isSimulated = true;
        this.updateState({ connectionStatus: "mock_preview" });
      };
    } catch {
      this.isSimulated = true;
      this.updateState({ connectionStatus: "mock_preview" });
    }
  }

  private handleIncomingEvent(event: LobbyWSEvent) {
    switch (event.type) {
      case "PLAYER_JOIN":
      case "PLAYER_LEAVE":
      case "READY_TOGGLE":
      case "SETTINGS_UPDATE":
      case "CHAT_MESSAGE":
      case "START_GAME":
        // Sync incoming server state
        if (event.payload && typeof event.payload === "object") {
          this.updateState(event.payload as Partial<LobbyRoomState>);
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
    this.notify();
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.state));
  }

  // Action: Toggle Ready status for current user or targeted player
  public toggleReady(playerId?: string) {
    const targetId =
      playerId || this.state.players.find((p) => p.isCurrentUser)?.id;
    if (!targetId) return;

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
    }
  }

  // Action: Send Chat Message
  public sendChatMessage(text: string) {
    const clean = text.trim();
    if (!clean) return;

    const currentUser =
      this.state.players.find((p) => p.isCurrentUser) || this.state.players[0];

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    const newMsg: LobbyChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: clean,
      timestamp: timeStr,
    };

    this.updateState({
      messages: [...this.state.messages, newMsg],
    });

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: "CHAT_MESSAGE",
          payload: newMsg,
        })
      );
    }
  }

  // Action: Update Host Settings
  public updateSettings(partialSettings: Partial<LobbySettings>) {
    const newSettings = {
      ...this.state.settings,
      ...partialSettings,
    };

    // If capacity changed, ensure room reflects it
    this.updateState({
      settings: newSettings,
      roomName: newSettings.roomName,
      isPrivate: newSettings.isPrivate,
    });

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: "SETTINGS_UPDATE",
          payload: newSettings,
        })
      );
    }
  }

  // Action: Host updates room name
  public updateRoomName(newName: string) {
    const clean = newName.trim();
    if (!clean) return;

    this.updateState({
      roomName: clean,
      settings: {
        ...this.state.settings,
        roomName: clean,
      },
    });
  }

  // Action: Validate & Start Game
  public validateGameStart(): {
    canStart: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    const capacity = this.state.settings.playerCapacity;
    const currentCount = this.state.players.length;

    if (currentCount < 6) {
      reasons.push(
        `Room requires at least 6 players (currently ${currentCount}).`
      );
    }

    if (currentCount < capacity) {
      const needed = capacity - currentCount;
      reasons.push(
        `Waiting for ${needed} more player${needed > 1 ? "s" : ""} to fill the room.`
      );
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

  // Demo Simulation Helper: Toggle between Host and Guest perspective
  public toggleDemoUserRole() {
    const isCurrentlyHost = this.state.players[0].isCurrentUser;

    const updated = this.state.players.map((p, idx) => {
      if (isCurrentlyHost) {
        // Switch to Guest (e.g. Shubh)
        return {
          ...p,
          isCurrentUser: idx === 1,
        };
      } else {
        // Switch back to Somya (Host)
        return {
          ...p,
          isCurrentUser: idx === 0,
        };
      }
    });

    this.updateState({ players: updated });
  }

  // Demo Simulation Helper: Fill remaining slots with mock players
  public simulateFillSlots() {
    const capacity = this.state.settings.playerCapacity;
    const current = [...this.state.players];

    const bonusPlayers: LobbyPlayer[] = [
      {
        id: "p_karan",
        name: "Karan",
        avatarUrl: "/images/player_shubh.png",
        isHost: false,
        isReady: true,
        isCurrentUser: false,
        slotIndex: 6,
      },
      {
        id: "p_ananya",
        name: "Ananya",
        avatarUrl: "/images/player_pari.png",
        isHost: false,
        isReady: true,
        isCurrentUser: false,
        slotIndex: 7,
      },
    ];

    while (current.length < capacity && bonusPlayers.length > 0) {
      const nextP = bonusPlayers.shift()!;
      nextP.slotIndex = current.length;
      current.push(nextP);
    }

    this.updateState({ players: current });
  }

  // Demo Simulation Helper: Ready all players (makes Riya ready)
  public simulateReadyAll() {
    const updated = this.state.players.map((p) => ({ ...p, isReady: true }));
    this.updateState({ players: updated });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
