"use client";

import React, { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { GamePageHeader } from "./GamePageHeader";
import { TabSwitcher, HubTab } from "./TabSwitcher";
import { CreateGameForm } from "./CreateGameForm";
import { RoleDistributionPanel } from "./RoleDistributionPanel";
import { JoinGamePanel } from "./GameJoinPanel";
import { PlayerCapacity } from "@/services/rooms";
import { MOCK_PLAYER_PROFILE } from "@/services/dashboard";

interface GameHubContainerProps {
  initialTab?: HubTab;
}

export function GameHubContainer({ initialTab = "create" }: GameHubContainerProps) {
  const [activeTab, setActiveTab] = useState<HubTab>(initialTab);
  const [selectedCapacity, setSelectedCapacity] = useState<PlayerCapacity>(7);

  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col selection:bg-purple-muted selection:text-gold-light relative overflow-x-hidden">
      {/* 1. Cinematic Background Vignette & Fog Layers */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-65"
        style={{
          background:
            "radial-gradient(ellipse 95% 75% at 50% 15%, #24101F 0%, #120A14 45%, #09060D 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-28 -left-24 w-[540px] h-[400px] rounded-full bg-purple-muted/15 blur-[140px] z-0"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-28 -right-24 w-[540px] h-[400px] rounded-full bg-burgundy-deep/25 blur-[140px] z-0"
        aria-hidden="true"
      />

      {/* 2. Top Navigation Bar */}
      <DashboardHeader
        activeNav={activeTab === "create" ? "create" : "join"}
        profile={MOCK_PLAYER_PROFILE}
      />

      {/* 3. Main Content Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 z-10 flex flex-col">
        {/* A. Page Header (Title, Subtitle, Architect Illustration) */}
        <GamePageHeader />

        {/* B. Create / Join Horizontal Tabs */}
        <TabSwitcher
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
        />

        {/* C. Interactive Panels Based on Active Tab */}
        {activeTab === "create" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mt-3">
            {/* Left Panel: Create Game Form (7 cols on lg) */}
            <div className="lg:col-span-7">
              <CreateGameForm
                capacity={selectedCapacity}
                onCapacityChange={(cap) => setSelectedCapacity(cap)}
              />
            </div>

            {/* Right Panel: Role Distribution & Quick Rules (5 cols on lg) */}
            <div className="lg:col-span-5">
              <RoleDistributionPanel capacity={selectedCapacity} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center my-auto py-8">
            <JoinGamePanel
              onSwitchToCreate={() => setActiveTab("create")}
            />
          </div>
        )}
      </main>

      {/* 4. Subtle Footer */}
      <footer className="z-10 py-4 text-center text-[11px] font-sans text-text-secondary/50 border-t border-gold-antique/10">
        AI TRAITORS • The Architect — Autonomous Multi-Agent Social Deduction Platform
      </footer>
    </div>
  );
}
