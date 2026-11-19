"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, ChevronRight, History } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { RoleAvatar } from "@/components/dashboard/RoleAvatar";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function HistoryPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { data, profile } = useDashboardData();

  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col relative overflow-x-hidden">
      <DashboardHeader
        profile={profile}
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto z-10">
        <DashboardSidebar
          activeTab="history"
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

          <div className="rounded-3xl bg-[#120A14]/85 border border-gold-antique/25 backdrop-blur-xl p-6 sm:p-8 max-w-3xl shadow-2xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gold-antique/15">
              <History className="w-6 h-6 text-gold-antique" />
              <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-gold-gradient">
                Match History
              </h1>
            </div>

            <div className="flex flex-col gap-3">
              {(data?.matches || []).map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#170C1B] border border-gold-antique/20 hover:border-gold-antique/40 transition"
                >
                  <div className="flex items-center gap-3.5">
                    <RoleAvatar faction={match.winning_team as "Faithful" | "Traitor"} className="w-10 h-10" />
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          match.winning_team === "Faithful"
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {match.winning_team} Win
                      </p>
                      <p className="text-xs font-sans text-text-secondary">
                        {match.played_at ? new Date(match.played_at).toLocaleDateString() : ""} • {Math.round(match.duration_seconds / 60)} min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-sans text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {match.player_count} Players
                    </span>
                    <ChevronRight className="w-4 h-4 text-gold-antique" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
