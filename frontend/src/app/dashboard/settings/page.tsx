"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Settings, Volume2, Shield, Bell } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function SettingsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { data, profile } = useDashboardData();
  const [soundEffects, setSoundEffects] = useState(true);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col relative overflow-x-hidden">
      <DashboardHeader
        profile={profile}
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto z-10">
        <DashboardSidebar
          activeTab="settings"
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

          <div className="rounded-3xl bg-[#120A14]/85 border border-gold-antique/25 backdrop-blur-xl p-6 sm:p-8 max-w-2xl shadow-2xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gold-antique/15">
              <Settings className="w-6 h-6 text-gold-antique" />
              <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-gold-gradient">
                Council Settings
              </h1>
            </div>

            <div className="flex flex-col gap-5">
              {/* Audio Settings */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#170C1B] border border-gold-antique/20">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-gold-antique" />
                  <div>
                    <p className="text-sm font-medium text-text-main">
                      Atmospheric Sound Effects
                    </p>
                    <p className="text-xs text-text-secondary">
                      Play audio cues during phase transitions
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={soundEffects}
                  onChange={(e) => setSoundEffects(e.target.checked)}
                  className="w-5 h-5 accent-gold-antique cursor-pointer"
                />
              </div>

              {/* Notification Settings */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#170C1B] border border-gold-antique/20">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-gold-antique" />
                  <div>
                    <p className="text-sm font-medium text-text-main">
                      Match Notifications
                    </p>
                    <p className="text-xs text-text-secondary">
                      Receive alerts when your turn approaches
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-5 h-5 accent-gold-antique cursor-pointer"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
