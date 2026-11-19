"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, User, Shield, Award, Calendar } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function ProfilePage() {
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
          activeTab="profile"
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

          <div className="rounded-3xl bg-[#120A14]/85 border border-gold-antique/25 backdrop-blur-xl p-8 max-w-2xl shadow-2xl">
            <div className="flex items-center gap-6 pb-6 border-b border-gold-antique/15">
              <div className="relative w-20 h-20 rounded-full border-2 border-gold-antique overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                <Image
                  src={profile.avatarUrl}
                  alt={profile.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-gold-gradient">
                  {profile.name}
                </h1>
                <p className="text-xs font-sans text-gold-light mt-1">
                  {profile.roleBadge}
                </p>
                <p className="text-xs font-sans text-text-secondary/70 mt-0.5">
                  {profile.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6">
              <div className="p-4 rounded-xl bg-[#170C1B] border border-gold-antique/15">
                <span className="text-xs font-sans text-text-secondary">Council Reputation</span>
                <p className="font-cinzel text-xl font-bold text-text-main mt-1">
                  {(data?.stats.reputation || 0).toLocaleString()} pts
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#170C1B] border border-gold-antique/15">
                <span className="text-xs font-sans text-text-secondary">Games Played</span>
                <p className="font-cinzel text-xl font-bold text-text-main mt-1">
                  {(data?.stats.games_played || 0)} Matches
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
