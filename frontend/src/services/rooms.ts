/**
 * Room Configuration & Management Service for AI TRAITORS
 * Connects directly to FastAPI backend with real-time multiplayer synchronization.
 */

import { getPlayerSession, setPlayerSession } from "./playerSession";

export type PlayerCapacity = 6 | 7 | 8;

export interface RoleBreakdown {
  traitors: number;
  doctor: number;
  detective: number;
  faithful: number;
}

export interface RoomConfig {
  roomName: string;
  playerCapacity: PlayerCapacity;
  nightDuration: number; // in seconds: 30, 45, 60, 90
  discussionDuration: number; // in seconds: 60, 120, 180, 240
  votingDuration: number; // in seconds: 30, 60, 90, 120
  isPrivate: boolean;
}

export interface RoomData {
  id: string;
  roomCode: string;
  roomName: string;
  hostName: string;
  playerCapacity: PlayerCapacity;
  currentPlayers: number;
  isPrivate: boolean;
  nightDuration: number;
  discussionDuration: number;
  votingDuration: number;
  status: "waiting" | "in_progress" | "finished";
  createdAt: string;
}

export interface RoomOperationResult {
  success: boolean;
  message: string;
  roomCode?: string;
  room?: RoomData;
  playerId?: string;
  isMock?: boolean;
}

export function getRoleDistribution(capacity: PlayerCapacity): RoleBreakdown {
  switch (capacity) {
    case 6:
      return { traitors: 2, doctor: 1, detective: 1, faithful: 2 };
    case 7:
      return { traitors: 2, doctor: 1, detective: 1, faithful: 3 };
    case 8:
      return { traitors: 2, doctor: 1, detective: 1, faithful: 4 };
    default:
      return { traitors: 2, doctor: 1, detective: 1, faithful: 3 };
  }
}

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    // If running on localhost or same host
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
    return ""; // Production deployments must configure the public API URL.
  }
  return "http://localhost:8000";
}

export function getWsBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  if (typeof window !== "undefined") {
    const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "ws://localhost:8000";
    }
    return ""; // Production deployments must configure the public WebSocket URL.
  }
  return "ws://localhost:8000";
}

/**
 * Creates a new game room
 */
export async function createRoom(config: RoomConfig): Promise<RoomOperationResult> {
  const apiUrl = getApiBaseUrl();
  const session = getPlayerSession();
  if (!session.accountToken) return { success: false, message: "Sign in before creating a game." };

  if (!config.roomName || config.roomName.trim().length < 3) {
    return {
      success: false,
      message: "Room name must be at least 3 characters long.",
    };
  }

  try {
    const res = await fetch(`${apiUrl}/api/v1/game/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accountToken}` },
      body: JSON.stringify({
        room_name: config.roomName.trim(),
        capacity: config.playerCapacity,
        is_private: config.isPrivate,
        nightDuration: config.nightDuration,
        discussionDuration: config.discussionDuration,
        votingDuration: config.votingDuration,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const roomCode = data.room_code || data.roomCode;
      const hostId = data.host_id || data.playerId;

      // Update session with returned hostId
      if (hostId) {
        setPlayerSession(session.name, session.avatarUrl, hostId, data.session_token, roomCode, session.id, session.accountToken);
      }

      return {
        success: true,
        message: "Room established successfully.",
        roomCode: roomCode,
        playerId: hostId,
        room: {
          id: roomCode,
          roomCode: roomCode,
          roomName: config.roomName,
          hostName: session.name,
          playerCapacity: config.playerCapacity,
          currentPlayers: 1,
          isPrivate: config.isPrivate,
          nightDuration: config.nightDuration,
          discussionDuration: config.discussionDuration,
          votingDuration: config.votingDuration,
          status: "waiting",
          createdAt: new Date().toISOString(),
        },
        isMock: false,
      };
    } else {
      const err = await res.json().catch(() => ({ detail: "Failed to create room." }));
      return {
        success: false,
        message: err.detail || "Failed to create room on server.",
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: "Could not connect to game backend. Please ensure the backend is running.",
    };
  }
}

/**
 * Joins an existing game room by code
 */
export async function joinRoom(roomCode: string): Promise<RoomOperationResult> {
  const apiUrl = getApiBaseUrl();
  const cleanCode = roomCode.trim().toUpperCase();
  const session = getPlayerSession();
  if (!session.accountToken) return { success: false, message: "Sign in before joining a game." };
  if (!cleanCode || cleanCode.length < 4) return { success: false, message: "Please enter a valid room code." };

  try {
    const res = await fetch(`${apiUrl}/api/v1/game/${cleanCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accountToken}` },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, message: data.detail || "Unable to join room." };
    const assignedId = data.player_id || data.playerId;
    setPlayerSession(session.name, session.avatarUrl, assignedId, data.session_token, cleanCode, session.id, session.accountToken);
    return { success: true, message: "Joined the room.", roomCode: cleanCode, playerId: assignedId, room: data.room, isMock: false };
  } catch {
    return { success: false, message: "Connection failed. Please check your network or backend server." };
  }
}
