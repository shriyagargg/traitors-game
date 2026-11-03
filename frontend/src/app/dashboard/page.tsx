"use client";

import React, { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { WelcomeSection } from "@/components/dashboard/WelcomeSection";
import { ActionCards } from "@/components/dashboard/ActionCards";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { RecentMatches } from "@/components/dashboard/RecentMatches";
import { RoleDonutChart } from "@/components/dashboard/RoleDonutChart";
import { QuickGuideCard } from "@/components/dashboard/QuickGuideCard";
import {
  MOCK_PLAYER_PROFILE,
  MOCK_PLAYER_STATS,
  MOCK_RECENT_MATCHES,
  MOCK_ROLE_DISTRIBUTION,
} from "@/services/dashboard";

export default function DashboardPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col selection:bg-purple-muted selection:text-gold-light relative overflow-x-hidden">
      {/* 1. Cinematic Background Vignette & Fog Layers */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 15%, #24101F 0%, #120A14 45%, #09060D 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-28 -left-24 w-[520px] h-[380px] rounded-full bg-purple-muted/15 blur-[140px] z-0"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-28 -right-24 w-[520px] h-[380px] rounded-full bg-burgundy-deep/25 blur-[140px] z-0"
        aria-hidden="true"
      />

      {/* 2. Top Navigation Bar */}
      <DashboardHeader
        activeNav="dashboard"
        profile={MOCK_PLAYER_PROFILE}
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      {/* 3. Main Dashboard Body (Sidebar + Content Area) */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto z-10 relative">
        {/* Left Sidebar */}
        <DashboardSidebar
          activeTab="dashboard"
          isOpenMobile={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Center / Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col min-w-0">
          {/* A. Welcome Banner */}
          <WelcomeSection playerName={MOCK_PLAYER_PROFILE.name} />

          {/* B. Action Cards (Create Game / Join Game) */}
          <ActionCards />

          {/* C. Compact Statistics Row */}
          <StatsRow stats={MOCK_PLAYER_STATS} />

          {/* D. Bottom Content Section (3 Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-1">
            {/* 1. Recent Matches (4.8 cols on lg) */}
            <div className="lg:col-span-5 rounded-3xl bg-[#120A14]/85 border border-gold-antique/25 backdrop-blur-xl p-5 sm:p-6 shadow-[0_4px_25px_rgba(18,10,20,0.5)]">
              <RecentMatches matches={MOCK_RECENT_MATCHES} />
            </div>

            {/* 2. Your Role Distribution Donut Chart (4.2 cols on lg) */}
            <div className="lg:col-span-4 rounded-3xl bg-[#120A14]/85 border border-gold-antique/25 backdrop-blur-xl p-5 sm:p-6 shadow-[0_4px_25px_rgba(18,10,20,0.5)] flex flex-col justify-between">
              <div>
                <h3 className="font-cormorant text-xl sm:text-2xl font-normal text-text-main tracking-wide mb-3">
                  Your Role Distribution
                </h3>
              </div>
              <RoleDonutChart
                stats={MOCK_ROLE_DISTRIBUTION}
                totalGames={MOCK_PLAYER_STATS.gamesPlayed}
              />
            </div>

            {/* 3. Quick Guide (3 cols on lg) */}
            <div className="lg:col-span-3 rounded-3xl bg-[#120A14]/85 border border-gold-antique/25 backdrop-blur-xl p-5 sm:p-6 shadow-[0_4px_25px_rgba(18,10,20,0.5)] flex flex-col justify-between">
              <QuickGuideCard />
            </div>
          </div>
        </main>
      </div>

      {/* 4. Subtle Footer */}
      <footer className="z-10 py-4 text-center text-[11px] font-sans text-text-secondary/50 border-t border-gold-antique/10">
        AI TRAITORS • The Architect — Autonomous Multi-Agent Gaming & Strategy Platform
      </footer>
    </div>
  );
}
