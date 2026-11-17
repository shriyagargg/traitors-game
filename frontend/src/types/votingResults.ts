export interface Voter {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface VoteTallyItem {
  targetId: string;
  targetName: string;
  targetAvatarUrl: string;
  votesCount: number;
  percentage: number;
  isBanished: boolean;
  voters: Voter[];
}

export type PlayerRole = "Traitor" | "Faithful" | "Detective" | "Doctor";

export interface BanishedPlayer {
  id: string;
  name: string;
  avatarUrl: string;
  votesReceived: number;
  totalVotesCast: number;
  role: PlayerRole;
  isTraitor: boolean;
  confession: string;
}

export type GameOutcomeStatus =
  | "CONTINUE_TO_NIGHT"
  | "FAITHFUL_VICTORY"
  | "TRAITOR_VICTORY";

export interface VotingResultsState {
  roomCode: string;
  roundNumber: number;
  phaseType: "Results";
  totalVotes: number;
  tallies: VoteTallyItem[];
  banishedPlayer: BanishedPlayer | null;
  isRoleRevealed: boolean;
  gameOutcome: GameOutcomeStatus;
  traitorsRemaining: number;
  faithfulRemaining: number;
  connectionStatus: "connected" | "mock_preview";
}

