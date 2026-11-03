"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart2 } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { RoleDonutChart } from "@/components/dashboard/RoleDonutChart";
import {
  MOCK_PLAYER_PROFILE,
  MOCK_PLAYER_STATS,
  MOCK_ROLE_DISTRIBUTION,
} from "@/services/dashboard";

export default function StatisticsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col relative overflow-x-hidden">
      <DashboardHeader
        profile={MOCK_PLAYER_PROFILE}
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto z-10">
        <DashboardSidebar
          activeTab="statistics"
          isOpenMobile={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        <main className="flex-1 p-6 sm:p-8 flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-6">
            <Link
              href="/dashboard"
              className="text-xs font-sans text-text-secondary hover:text-gold-light flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          <div className="rounded-3xl bg-[#120A14]/85 border border-gold-antique/25 backdrop-blur-xl p-6 sm:p-8 max-w-4xl shadow-2xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gold-antique/15">
              <BarChart2 className="w-6 h-6 text-gold-antique" />
              <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-gold-gradient">
                Tactical Statistics
              </h1>
            </div>

            <StatsRow stats={MOCK_PLAYER_STATS} />

            <div className="mt-8 p-6 rounded-2xl bg-[#170C1B] border border-gold-antique/20 max-w-md">
              <h3 className="font-cormorant text-xl font-normal text-text-main mb-4">
                Role Frequency Breakdown
              </h3>
              <RoleDonutChart
                stats={MOCK_ROLE_DISTRIBUTION}
                totalGames={MOCK_PLAYER_STATS.gamesPlayed}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
