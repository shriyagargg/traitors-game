export interface VotingPlayer {
  id: string;
  name: string;
  avatarUrl: string;
  isAlive: boolean;
  isHost: boolean;
  isCurrentUser: boolean;
}

export interface VotingTarget {
  id: string;
  name: string;
  avatarUrl: string;
  isSelectable: boolean;
}

export interface VotingPhaseState {
  roomCode: string;
  roundNumber: number;
  phaseType: "Day";
  timerSeconds: number;
  currentUserId: string;
  selectedTargetId: string | null;
  isSubmitted: boolean;
  submittedTargetName: string | null;
  connectionStatus: "connected" | "mock_preview";
  isTimeUp?: boolean;
  allVotesRecorded?: boolean;
}
