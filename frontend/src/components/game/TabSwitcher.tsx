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
    <div className="flex flex-col sm:flex-row items-center justify-start gap-2 mb-5 w-full z-10 relative">
      {/* Tab 1: Create a Game */}
      <button
        type="button"
        onClick={() => onTabChange("create")}
        className={`w-full sm:w-auto py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2.5 transition-all duration-300 ${
          activeTab === "create"
            ? "bg-[#392c40] text-white font-semibold"
            : "bg-transparent border border-white/10 text-[#b9b0bd] hover:text-white font-medium"
        }`}
      >
        <Gamepad2
          className={`w-5 h-5 ${
            activeTab === "create" ? "text-[#e1cbd4] stroke-[2.2]" : "text-[#c4a6d2]"
          }`}
        />
        <span>Create a Game</span>
      </button>

      {/* Tab 2: Join a Game */}
      <button
        type="button"
        onClick={() => onTabChange("join")}
        className={`w-full sm:w-auto py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2.5 transition-all duration-300 ${
          activeTab === "join"
            ? "bg-[#392c40] text-white font-semibold"
            : "bg-transparent border border-white/10 text-[#b9b0bd] hover:text-white font-medium"
        }`}
      >
        <Users
          className={`w-5 h-5 ${
            activeTab === "join" ? "text-[#e1cbd4] stroke-[2.2]" : "text-[#c4a6d2]"
          }`}
        />
        <span>Join a Game</span>
      </button>
    </div>
  );
}
