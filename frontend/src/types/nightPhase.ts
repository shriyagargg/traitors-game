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
  selectedTargetId: string | null;
  isSubmitted: boolean;
  submittedTargetName: string | null;
  connectionStatus: "connected" | "mock_preview";
  isTimeUp?: boolean;
  allActionsResolved?: boolean;
  investigationResult?: { targetName: string; isTraitor: boolean } | null;
}
