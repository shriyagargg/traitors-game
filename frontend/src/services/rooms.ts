/**
 * Room Configuration & Management Service for AI TRAITORS
 * Manages player capacity, game timings, role distribution formulas,
 * and API adapter for Room creation/joining.
 */

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
  isMock?: boolean;
}

/**
 * Deterministic Role Distribution Formula as mandated by Master Architecture:
 * 6 Players: 2 Traitors, 1 Doctor, 1 Detective, 2 Faithful
 * 7 Players: 2 Traitors, 1 Doctor, 1 Detective, 3 Faithful
 * 8 Players: 2 Traitors, 1 Doctor, 1 Detective, 4 Faithful
 */
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

/**
 * Creates a new game room
 */
export async function createRoom(config: RoomConfig): Promise<RoomOperationResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Validate room name
  if (!config.roomName || config.roomName.trim().length < 3) {
    return {
      success: false,
      message: "Room name must be at least 3 characters long.",
    };
  }

  try {
    const res = await fetch(`${apiUrl}/api/v1/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: "Room established successfully.",
        roomCode: data.room_code,
        room: data.room,
        isMock: false,
      };
    }
  } catch {
    // Backend room endpoint not yet active (Phase 2)
  }

  // Graceful simulation with realistic latency
  await new Promise((resolve) => setTimeout(resolve, 850));

  // Generate a stylish 6-character room code (e.g. TRTR-8821)
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const generatedCode = `AIT-${randomSuffix}`;

  return {
    success: true,
    message: `Room "${config.roomName}" configured (Preview simulation). Ready to invite council members.`,
    roomCode: generatedCode,
    room: {
      id: `room_${randomSuffix}`,
      roomCode: generatedCode,
      roomName: config.roomName,
      hostName: "Somya",
      playerCapacity: config.playerCapacity,
      currentPlayers: 1,
      isPrivate: config.isPrivate,
      nightDuration: config.nightDuration,
      discussionDuration: config.discussionDuration,
      votingDuration: config.votingDuration,
      status: "waiting",
      createdAt: new Date().toISOString(),
    },
    isMock: true,
  };
}

/**
 * Joins an existing game room by code
 */
export async function joinRoom(roomCode: string): Promise<RoomOperationResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const cleanCode = roomCode.trim().toUpperCase();

  if (!cleanCode || cleanCode.length < 4) {
    return {
      success: false,
      message: "Please enter a valid room code (at least 4 characters).",
    };
  }

  try {
    const res = await fetch(`${apiUrl}/api/v1/rooms/${cleanCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: "Entered council chamber successfully.",
        roomCode: cleanCode,
        room: data.room,
        isMock: false,
      };
    }
  } catch {
    // Backend endpoint on standby
  }

  await new Promise((resolve) => setTimeout(resolve, 750));

  return {
    success: true,
    message: `Connected to chamber [${cleanCode}] (Preview simulation). Welcome to the council.`,
    roomCode: cleanCode,
    room: {
      id: `room_${cleanCode.toLowerCase()}`,
      roomCode: cleanCode,
      roomName: "Council Chamber",
      hostName: "The Architect",
      playerCapacity: 7,
      currentPlayers: 4,
      isPrivate: false,
      nightDuration: 60,
      discussionDuration: 180,
      votingDuration: 90,
      status: "waiting",
      createdAt: new Date().toISOString(),
    },
    isMock: true,
  };
}
