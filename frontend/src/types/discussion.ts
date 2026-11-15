export interface DiscussionPlayer {
  id: string;
  name: string;
  avatarUrl: string;
  isAlive: boolean;
  isHost: boolean;
  isCurrentUser: boolean;
  isMuted?: boolean;
}

export interface DiscussionMessage {
  id: string;
  senderId: string;
  senderName: string;
  avatarUrl: string;
  timestamp: string;
  text: string;
}

export interface ArchitectAnnouncement {
  id: string;
  title: string;
  message: string;
  timestamp?: string;
}

export interface DiscussionState {
  roomCode: string;
  roundNumber: number;
  phaseName: string;
  phaseType: "Day" | "Night";
  timerSeconds: number;
  announcement: ArchitectAnnouncement;
  players: DiscussionPlayer[];
  messages: DiscussionMessage[];
  connectionStatus: "connected" | "mock_preview";
  isTimeUp?: boolean;
  autoAdvanceSeconds?: number;
}
