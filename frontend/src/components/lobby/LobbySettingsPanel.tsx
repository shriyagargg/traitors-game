"use client";

import React from "react";
import {
  Settings,
  Users,
  Moon,
  MessageSquare,
  Scale,
  Plus,
  Search,
  Shield,
  ChevronDown,
} from "lucide-react";
import { DramaMaskIcon } from "../game/DramaMaskIcon";
import { LobbySettings } from "@/types/lobby";
import { PlayerCapacity, getRoleDistribution } from "@/services/rooms";

interface LobbySettingsPanelProps {
  settings: LobbySettings;
  isHost: boolean;
  onUpdateSettings: (newSettings: Partial<LobbySettings>) => void;
}

export function LobbySettingsPanel({
  settings,
  isHost,
  onUpdateSettings,
}: LobbySettingsPanelProps) {
  const roles = getRoleDistribution(settings.playerCapacity);

  return (
    <div className="w-full rounded-2xl bg-[#120A14]/90 border border-gold-antique/30 backdrop-blur-xl p-5 sm:p-6 shadow-[0_4px_30px_rgba(20,9,28,0.5)] flex flex-col justify-between">
      {/* 1. Header: Game Settings */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[#1A0E1C] border border-gold-antique/30 flex items-center justify-center shrink-0">
            <Settings className="w-4 h-4 text-gold-antique" />
          </div>
          <h2 className="font-cormorant text-xl sm:text-2xl font-bold text-[#F5EEDC] tracking-wide">
            Game Settings
          </h2>
          {!isHost && (
            <span className="text-[10px] text-text-secondary/70 ml-auto border border-gold-antique/20 px-1.5 py-0.5 rounded">
              Read Only
            </span>
          )}
        </div>

        {/* 2. Settings Controls */}
        <div className="space-y-3 font-sans">
          {/* A. Players Capacity */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <Users className="w-4 h-4 text-gold-antique/80" />
              <span>Players</span>
            </div>
            <div className="relative">
              <select
                disabled={!isHost}
                value={settings.playerCapacity}
                onChange={(e) =>
                  onUpdateSettings({
                    playerCapacity: Number(e.target.value) as PlayerCapacity,
                  })
                }
                className="appearance-none bg-[#1A0E1C] border border-gold-antique/30 text-gold-light rounded-lg px-3 py-1.5 pr-7 text-xs font-semibold focus:outline-none focus:border-gold-antique cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed shadow-inner"
              >
                <option value={6} className="bg-[#120A14] text-[#F5EEDC]">
                  6 Players
                </option>
                <option value={7} className="bg-[#120A14] text-[#F5EEDC]">
                  7 Players
                </option>
                <option value={8} className="bg-[#120A14] text-[#F5EEDC]">
                  8 Players
                </option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gold-antique absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* B. Night Phase Timer */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <Moon className="w-4 h-4 text-gold-antique/80" />
              <span>Night Phase</span>
            </div>
            <div className="relative">
              <select
                disabled={!isHost}
                value={settings.nightDuration}
                onChange={(e) =>
                  onUpdateSettings({ nightDuration: Number(e.target.value) })
                }
                className="appearance-none bg-[#1A0E1C] border border-gold-antique/30 text-gold-light rounded-lg px-3 py-1.5 pr-7 text-xs font-semibold focus:outline-none focus:border-gold-antique cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed shadow-inner"
              >
                <option value={30} className="bg-[#120A14] text-[#F5EEDC]">
                  30 sec
                </option>
                <option value={45} className="bg-[#120A14] text-[#F5EEDC]">
                  45 sec
                </option>
                <option value={60} className="bg-[#120A14] text-[#F5EEDC]">
                  60 sec
                </option>
                <option value={90} className="bg-[#120A14] text-[#F5EEDC]">
                  90 sec
                </option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gold-antique absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* C. Discussion Timer */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <MessageSquare className="w-4 h-4 text-gold-antique/80" />
              <span>Discussion</span>
            </div>
            <div className="relative">
              <select
                disabled={!isHost}
                value={settings.discussionDuration}
                onChange={(e) =>
                  onUpdateSettings({ discussionDuration: Number(e.target.value) })
                }
                className="appearance-none bg-[#1A0E1C] border border-gold-antique/30 text-gold-light rounded-lg px-3 py-1.5 pr-7 text-xs font-semibold focus:outline-none focus:border-gold-antique cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed shadow-inner"
              >
                <option value={60} className="bg-[#120A14] text-[#F5EEDC]">
                  60 sec
                </option>
                <option value={120} className="bg-[#120A14] text-[#F5EEDC]">
                  120 sec
                </option>
                <option value={180} className="bg-[#120A14] text-[#F5EEDC]">
                  180 sec
                </option>
                <option value={240} className="bg-[#120A14] text-[#F5EEDC]">
                  240 sec
                </option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gold-antique absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* D. Voting Timer */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <Scale className="w-4 h-4 text-gold-antique/80" />
              <span>Voting</span>
            </div>
            <div className="relative">
              <select
                disabled={!isHost}
                value={settings.votingDuration}
                onChange={(e) =>
                  onUpdateSettings({ votingDuration: Number(e.target.value) })
                }
                className="appearance-none bg-[#1A0E1C] border border-gold-antique/30 text-gold-light rounded-lg px-3 py-1.5 pr-7 text-xs font-semibold focus:outline-none focus:border-gold-antique cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed shadow-inner"
              >
                <option value={30} className="bg-[#120A14] text-[#F5EEDC]">
                  30 sec
                </option>
                <option value={60} className="bg-[#120A14] text-[#F5EEDC]">
                  60 sec
                </option>
                <option value={90} className="bg-[#120A14] text-[#F5EEDC]">
                  90 sec
                </option>
                <option value={120} className="bg-[#120A14] text-[#F5EEDC]">
                  120 sec
                </option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gold-antique absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Diamond Separator */}
      <div className="flex items-center justify-center gap-2 my-4 opacity-75">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-gold-antique/40" />
        <span className="text-gold-antique text-[9px] transform rotate-45 select-none">◆</span>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-gold-antique/40" />
      </div>

      {/* 4. Role Distribution (Dynamic) */}
      <div>
        <h3 className="font-cormorant text-lg font-bold text-[#F5EEDC] mb-3">
          Role Distribution ({settings.playerCapacity} Players)
        </h3>

        <div className="space-y-2.5">
          {/* Row 1: Traitors */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#1A0B13]/70 border border-rose-500/25">
            <div className="flex items-center gap-2.5">
              <DramaMaskIcon className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-xs font-medium text-[#F5EEDC]">Traitors</span>
            </div>
            <span className="font-cinzel text-sm font-bold text-rose-300">
              {roles.traitors}
            </span>
          </div>

          {/* Row 2: Doctor */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0B1A13]/70 border border-emerald-500/25">
            <div className="flex items-center gap-2.5">
              <Plus className="w-4 h-4 text-emerald-400 stroke-[3] shrink-0" />
              <span className="text-xs font-medium text-[#F5EEDC]">Doctor</span>
            </div>
            <span className="font-cinzel text-sm font-bold text-emerald-300">
              {roles.doctor}
            </span>
          </div>

          {/* Row 3: Detective */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#1A160B]/70 border border-gold-antique/25">
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-gold-antique stroke-[2.5] shrink-0" />
              <span className="text-xs font-medium text-[#F5EEDC]">Detective</span>
            </div>
            <span className="font-cinzel text-sm font-bold text-gold-light">
              {roles.detective}
            </span>
          </div>

          {/* Row 4: Faithful */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0B131A]/70 border border-blue-500/25">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-blue-400 stroke-[2] shrink-0" />
              <span className="text-xs font-medium text-[#F5EEDC]">Faithful</span>
            </div>
            <span className="font-cinzel text-sm font-bold text-blue-300">
              {roles.faithful}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
