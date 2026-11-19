"use client";
import React from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { WelcomeSection } from "@/components/dashboard/WelcomeSection";
import { ActionCards } from "@/components/dashboard/ActionCards";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { RecentMatches } from "@/components/dashboard/RecentMatches";
import { useDashboardData } from "@/hooks/useDashboardData";
export default function DashboardPage() {
 const { data, error, profile } = useDashboardData();
 const stats = data ? {gamesPlayed:data.stats.games_played,wins:data.stats.wins,winRate:data.stats.win_rate,currentStreak:data.stats.current_streak,reputation:data.stats.reputation} : null;
 const matches = (data?.matches||[]).map(m=>({id:m.id,winningTeam:m.winning_team as "Faithful"|"Traitor",date:m.played_at?new Date(m.played_at).toLocaleDateString():"",duration:`${Math.round(m.duration_seconds/60)} min`,playerCount:m.player_count,playerRole:m.player_role as "Faithful",outcome:m.outcome as "Victory"|"Defeat"}));
 return <div className="min-h-screen text-[#f5f1f7]"><DashboardHeader activeNav="dashboard" profile={profile}/><div className="mx-auto w-full max-w-6xl"><main className="space-y-6 px-4 py-8 sm:px-8"><WelcomeSection playerName={profile.name}/><ActionCards/>{error&&<p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-950/20 p-4 text-sm text-rose-200">{error}</p>}{!data&&!error&&<section className="rounded-2xl border border-white/10 bg-[#19151d] p-5 text-sm text-[#b9b0bd]">Loading your account…</section>}{stats&&<StatsRow stats={stats}/>}<section className="rounded-2xl border border-white/10 bg-[#19151d] p-5 sm:p-6"><RecentMatches matches={matches} emptyMessage="No completed games yet. Your match history will appear here."/></section></main></div></div>;
}
