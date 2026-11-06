import { PlayerCapacity } from "@/services/rooms";

export interface LobbyPlayer {
  id: string;
  name: string;
  avatarUrl: string;
  isHost: boolean;
  isReady: boolean;
  isCurrentUser: boolean;
  slotIndex: number;
}

export interface LobbySettings {
  playerCapacity: PlayerCapacity;
  nightDuration: number; // 30, 45, 60, 90
  discussionDuration: number; // 60, 120, 180, 240
  votingDuration: number; // 30, 60, 90, 120
  isPrivate: boolean;
  roomName: string;
}

export interface LobbyChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

export type LobbyConnectionStatus =
  | "connected"
  | "connecting"
  | "mock_preview"
  | "disconnected";

export interface LobbyRoomState {
  roomCode: string;
  roomName: string;
  isPrivate: boolean;
  hostId: string;
  settings: LobbySettings;
  players: LobbyPlayer[];
  messages: LobbyChatMessage[];
  status: "waiting" | "starting" | "in_progress";
  connectionStatus: LobbyConnectionStatus;
}

export type LobbyEventType =
  | "PLAYER_JOIN"
  | "PLAYER_LEAVE"
  | "READY_TOGGLE"
  | "SETTINGS_UPDATE"
  | "ROOM_NAME_UPDATE"
  | "CHAT_MESSAGE"
  | "START_GAME"
  | "ERROR";

export interface LobbyWSEvent<T = unknown> {
  type: LobbyEventType;
  payload: T;
  timestamp: string;
}
