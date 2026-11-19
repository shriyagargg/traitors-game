"use client";

import React, { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { GamePageHeader } from "./GamePageHeader";
import { TabSwitcher, HubTab } from "./TabSwitcher";
import { CreateGameForm } from "./CreateGameForm";
import { RoleDistributionPanel } from "./RoleDistributionPanel";
import { JoinGamePanel } from "./GameJoinPanel";
import { PlayerCapacity } from "@/services/rooms";
import { getPlayerSession } from "@/services/playerSession";

interface GameHubContainerProps {
  initialTab?: HubTab;
}

export function GameHubContainer({ initialTab = "create" }: GameHubContainerProps) {
  const [activeTab, setActiveTab] = useState<HubTab>(initialTab);
  const [selectedCapacity, setSelectedCapacity] = useState<PlayerCapacity>(7);

  return (
    <div className="min-h-screen bg-[#100d13] text-[#f5f1f7] flex flex-col">
      {/* 2. Top Navigation Bar */}
      <DashboardHeader
        activeNav={activeTab === "create" ? "create" : "join"}
        profile={{ name: getPlayerSession().name, email: getPlayerSession().email || "", avatarUrl: getPlayerSession().avatarUrl, roleBadge: "Council Initiate" }}
      />

      {/* 3. Main Content Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10 flex flex-col">
        {/* A. Page Header (Title, Subtitle, Architect Illustration) */}
        <GamePageHeader />

        {/* B. Create / Join Horizontal Tabs */}
        <TabSwitcher
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
        />

        {/* C. Interactive Panels Based on Active Tab */}
        {activeTab === "create" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start mt-4">
            {/* Left Panel: Create Game Form (7 cols on lg) */}
            <div className="lg:col-span-8">
              <CreateGameForm
                capacity={selectedCapacity}
                onCapacityChange={(cap) => setSelectedCapacity(cap)}
              />
            </div>

            {/* Right Panel: Role Distribution & Quick Rules (5 cols on lg) */}
            <div className="lg:col-span-4">
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
      <footer className="z-10 py-4 text-center text-xs text-[#817986] border-t border-white/10">
        AI Traitors
      </footer>
    </div>
  );
}
