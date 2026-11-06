export type GameRole = "traitor" | "doctor" | "detective" | "faithful";

export interface RoleConfig {
  role: GameRole;
  title: string;
  subtitle: string;
  accentColor: string; // e.g. #DC2626
  glowColor: string; // e.g. rgba(220, 38, 38, 0.4)
  badgeBg: string;
  borderColor: string;
  textColor: string;
  imageSrc: string;
  objective: string;
  abilities: string[];
  reminder: string;
}

export interface PlayerSecretIdentity {
  playerId: string;
  playerName: string;
  roomCode: string;
  roundNumber: number;
  role: GameRole;
  isMock: boolean;
}
