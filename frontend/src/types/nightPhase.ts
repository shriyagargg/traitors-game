import { GameRole } from "./roleReveal";

export type NightActionType =
  | "elimination"
  | "protection"
  | "investigation"
  | "none";

export interface NightPlayerTarget {
  id: string;
  name: string;
  avatarUrl: string;
  isAlive: boolean;
  isSelectable: boolean;
}

export interface NightRoleConfig {
  role: GameRole;
  actionType: NightActionType;
  heading: string;
  subtitle: string;
  buttonText: string;
  accentColor: string; // e.g. #DC2626
  ringClass: string;
  radioBgClass: string;
  announcementText: string;
}

export interface NightPhaseState {
  roomCode: string;
  roundNumber: number;
  timerSeconds: number;
  currentRole: GameRole;
  currentUserId: string;
  serverPhase?: string;
  selectedTargetId: string | null;
  isSubmitted: boolean;
  submittedTargetName: string | null;
  connectionStatus: "connected" | "disconnected";
  hasSynced?: boolean;
  isTimeUp?: boolean;
  allActionsResolved?: boolean;
  investigationResult?: { targetName: string; isTraitor: boolean } | null;
  // Players list stored in state so React re-renders when it changes
  allPlayers?: any[];
  targets?: NightPlayerTarget[];
}
