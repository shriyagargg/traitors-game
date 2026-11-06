/**
 * Dashboard Data Service for AI TRAITORS: The Architect
 * Provides typed definitions and isolated demonstration mock data.
 * Ready for drop-in backend API integration once Phase 2 endpoints are active.
 */

export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  winRate: number; // percentage
  currentStreak: number;
  reputation: number;
}

export interface RecentMatch {
  id: string;
  winningTeam: "Faithful" | "Traitor";
  date: string;
  duration: string;
  playerCount: number;
  playerRole: "Faithful" | "Traitor" | "Doctor" | "Detective";
  outcome: "Victory" | "Defeat";
}

export interface RoleStat {
  role: "Traitor" | "Doctor" | "Detective" | "Faithful";
  count: number;
  percentage: number;
  color: string;
}

export interface PlayerProfile {
  name: string;
  avatarUrl: string;
  roleBadge: string;
  email: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  time: string;
  read: boolean;
}

export const MOCK_PLAYER_PROFILE: PlayerProfile = {
  name: "Somya",
  avatarUrl: "/images/somya_avatar.png",
  roleBadge: "Council Sovereign",
  email: "somya@aitraitors.council",
};

export const MOCK_PLAYER_STATS: PlayerStats = {
  gamesPlayed: 24,
  wins: 14,
  winRate: 58,
  currentStreak: 6,
  reputation: 1240,
};

export const MOCK_RECENT_MATCHES: RecentMatch[] = [
  {
    id: "match-01",
    winningTeam: "Faithful",
    date: "Oct 30, 2026",
    duration: "42 min",
    playerCount: 8,
    playerRole: "Faithful",
    outcome: "Victory",
  },
  {
    id: "match-02",
    winningTeam: "Traitor",
    date: "Oct 28, 2026",
    duration: "36 min",
    playerCount: 7,
    playerRole: "Traitor",
    outcome: "Victory",
  },
  {
    id: "match-03",
    winningTeam: "Faithful",
    date: "Oct 25, 2026",
    duration: "49 min",
    playerCount: 8,
    playerRole: "Doctor",
    outcome: "Victory",
  },
];

export const MOCK_ROLE_DISTRIBUTION: RoleStat[] = [
  {
    role: "Traitor",
    count: 6,
    percentage: 25,
    color: "#E11D48", // muted rose / red
  },
  {
    role: "Doctor",
    count: 4,
    percentage: 17,
    color: "#10B981", // emerald green
  },
  {
    role: "Detective",
    count: 4,
    percentage: 17,
    color: "#D4AF37", // antique gold
  },
  {
    role: "Faithful",
    count: 10,
    percentage: 41,
    color: "#3B82F6", // muted blue
  },
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "The Architect initiated a new council session in Room #408.",
    time: "10m ago",
    read: false,
  },
  {
    id: "notif-2",
    title: "Match #24 analysis and suspicion score report is ready.",
    time: "2h ago",
    read: true,
  },
  {
    id: "notif-3",
    title: "Reputation score increased by +35 points.",
    time: "Yesterday",
    read: true,
  },
];
