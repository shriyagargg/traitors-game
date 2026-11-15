import { PlayerRole } from "./votingResults";

export type VictoryOutcome = "FAITHFUL_VICTORY" | "TRAITOR_VICTORY";

export interface RevealedPlayer {
  id: string;
  name: string;
  avatarUrl: string;
  role: PlayerRole;
  isTraitor: boolean;
  status: "SURVIVED" | "BANISHED" | "MURDERED";
  statusRoundText: string;
  isCurrentUser: boolean;
}

export interface MatchStatItem {
  label: string;
  value: string | number;
  subtext?: string;
}

export interface VictoryState {
  roomCode: string;
  roundsPlayed: number;
  outcome: VictoryOutcome;
  winningFaction: "The Faithful" | "The Traitors";
  prizePool: string;
  architectVerdict: string;
  revealedPlayers: RevealedPlayer[];
  stats: MatchStatItem[];
  connectionStatus: "connected" | "mock_preview";
}

