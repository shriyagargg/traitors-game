export interface MorningPlayer {
  id: string;
  name: string;
  avatarUrl: string;
  isAlive: boolean;
  isEliminatedTonight: boolean;
  isHost: boolean;
  isCurrentUser: boolean;
}

export interface MorningAnnouncementState {
  roomCode: string;
  roundNumber: number;
  phaseType: "Day";
  eliminatedPlayer: MorningPlayer | null;
  players: MorningPlayer[];
  roleRevealPermitted: boolean;
  connectionStatus: "connected" | "disconnected";
  dynamicAnnouncement?: string | null;
}
