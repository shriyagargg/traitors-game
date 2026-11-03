"use client";

import React from "react";
import { Gamepad2, Users } from "lucide-react";

export type HubTab = "create" | "join";

interface TabSwitcherProps {
  activeTab: HubTab;
  onTabChange: (tab: HubTab) => void;
}

export function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 my-6 w-full max-w-xl mx-auto z-10 relative">
      {/* Tab 1: Create a Game */}
      <button
        type="button"
        onClick={() => onTabChange("create")}
        className={`w-full sm:w-1/2 py-3.5 px-6 rounded-2xl font-cinzel text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 ${
          activeTab === "create"
            ? "bg-gradient-to-r from-gold-light via-[#F3DEAA] to-gold-antique text-background font-bold shadow-[0_0_25px_rgba(242,216,154,0.35)] scale-[1.02]"
            : "bg-[#120A14]/80 hover:bg-[#1A0E1C] border border-gold-antique/50 text-text-main hover:text-gold-light font-medium backdrop-blur-md shadow-sm"
        }`}
      >
        <Gamepad2
          className={`w-5 h-5 ${
            activeTab === "create" ? "text-background stroke-[2.2]" : "text-gold-antique"
          }`}
        />
        <span>Create a Game</span>
      </button>

      {/* Tab 2: Join a Game */}
      <button
        type="button"
        onClick={() => onTabChange("join")}
        className={`w-full sm:w-1/2 py-3.5 px-6 rounded-2xl font-cinzel text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 ${
          activeTab === "join"
            ? "bg-gradient-to-r from-gold-light via-[#F3DEAA] to-gold-antique text-background font-bold shadow-[0_0_25px_rgba(242,216,154,0.35)] scale-[1.02]"
            : "bg-[#120A14]/80 hover:bg-[#1A0E1C] border border-gold-antique/50 text-text-main hover:text-gold-light font-medium backdrop-blur-md shadow-sm"
        }`}
      >
        <Users
          className={`w-5 h-5 ${
            activeTab === "join" ? "text-background stroke-[2.2]" : "text-gold-antique"
          }`}
        />
        <span>Join a Game</span>
      </button>
    </div>
  );
}
