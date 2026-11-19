/**
 * Dashboard Data Service for AI TRAITORS: The Architect
 * Loads account statistics and match history from the authenticated backend.
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

export interface DashboardData {
  user: { id: string; username: string; email: string; avatar_url?: string; role_badge?: string };
  stats: { games_played: number; wins: number; losses: number; win_rate: number; current_streak: number; reputation: number; traitor_count: number; faithful_count: number; doctor_count: number; detective_count: number };
  matches: Array<{ id: string; room_code: string; player_role: string; winning_team: string; outcome: string; player_count: number; duration_seconds: number; played_at: string | null }>;
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const { getApiBaseUrl } = await import("@/services/rooms");
  const { getPlayerSession } = await import("@/services/playerSession");
  const token = getPlayerSession().accountToken;
  if (!token) throw new Error("Sign in to view your dashboard.");
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/dashboard`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok) throw new Error("Could not load your account data.");
  return response.json();
}
