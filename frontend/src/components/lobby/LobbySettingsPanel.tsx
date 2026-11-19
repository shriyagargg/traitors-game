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
  Lock,
} from "lucide-react";
import { DramaMaskIcon } from "../game/DramaMaskIcon";
import { LobbySettings } from "@/types/lobby";
import { getRoleDistribution } from "@/services/rooms";

interface LobbySettingsPanelProps {
  settings: LobbySettings;
}

export function LobbySettingsPanel({
  settings,
}: LobbySettingsPanelProps) {
  const roles = getRoleDistribution(settings.playerCapacity);

  return (
    <div className="w-full rounded-2xl bg-[#19151d] border border-white/10 p-5 sm:p-6 flex flex-col justify-between shadow-[0_4px_30px_rgba(20,9,28,0.4)]">
      {/* 1. Header: Game Settings */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#2b2131] border border-white/10 flex items-center justify-center shrink-0">
            <Settings className="w-4 h-4 text-[#c4a6d2]" />
          </div>
          <div>
            <h2 className="font-cormorant text-xl sm:text-2xl font-bold text-white tracking-wide">
              Game Rules
            </h2>
          </div>
          <span className="text-[10px] text-[#b9b0bd]/70 ml-auto border border-white/10 bg-[#120d15] px-2 py-0.5 rounded flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#c4a6d2]" />
            <span>Locked</span>
          </span>
        </div>

        {/* 2. Settings Summary List */}
        <div className="space-y-2.5 font-sans">
          {/* A. Capacity */}
          <div className="flex items-center justify-between text-xs sm:text-sm px-3 py-2 rounded-xl bg-[#211b25] border border-white/5">
            <div className="flex items-center gap-2 text-[#b9b0bd]">
              <Users className="w-4 h-4 text-[#c4a6d2]" />
              <span>Chamber Size</span>
            </div>
            <span className="font-semibold text-white font-mono text-xs">
              {settings.playerCapacity} Seats
            </span>
          </div>

          {/* B. Night Phase Timer */}
          <div className="flex items-center justify-between text-xs sm:text-sm px-3 py-2 rounded-xl bg-[#211b25] border border-white/5">
            <div className="flex items-center gap-2 text-[#b9b0bd]">
              <Moon className="w-4 h-4 text-[#c4a6d2]" />
              <span>Night Phase</span>
            </div>
            <span className="font-semibold text-white font-mono text-xs">
              {settings.nightDuration || 30}s
            </span>
          </div>

          {/* C. Discussion Timer */}
          <div className="flex items-center justify-between text-xs sm:text-sm px-3 py-2 rounded-xl bg-[#211b25] border border-white/5">
            <div className="flex items-center gap-2 text-[#b9b0bd]">
              <MessageSquare className="w-4 h-4 text-[#c4a6d2]" />
              <span>Council Discussion</span>
            </div>
            <span className="font-semibold text-white font-mono text-xs">
              {settings.discussionDuration || 120}s
            </span>
          </div>

          {/* D. Voting Timer */}
          <div className="flex items-center justify-between text-xs sm:text-sm px-3 py-2 rounded-xl bg-[#211b25] border border-white/5">
            <div className="flex items-center gap-2 text-[#b9b0bd]">
              <Scale className="w-4 h-4 text-[#c4a6d2]" />
              <span>Banishment Vote</span>
            </div>
            <span className="font-semibold text-white font-mono text-xs">
              {settings.votingDuration || 60}s
            </span>
          </div>
        </div>
      </div>

      {/* 3. Subtle Divider */}
      <div className="flex items-center justify-center gap-2 my-4 opacity-50">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/20" />
        <span className="text-[#c4a6d2] text-[8px] transform rotate-45 select-none">◆</span>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/20" />
      </div>

      {/* 4. Role Distribution Breakdown */}
      <div>
        <h3 className="text-xs uppercase font-semibold text-[#b9b0bd]/80 tracking-wider mb-2.5">
          Role Allotment ({settings.playerCapacity} Players)
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {/* Traitors */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#26151b] border border-rose-500/20">
            <div className="flex items-center gap-2">
              <DramaMaskIcon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="text-xs font-medium text-white">Traitors</span>
            </div>
            <span className="font-mono text-xs font-bold text-rose-300">
              {roles.traitors}
            </span>
          </div>

          {/* Doctor */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#14261d] border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-emerald-400 stroke-[3] shrink-0" />
              <span className="text-xs font-medium text-white">Doctor</span>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-300">
              {roles.doctor}
            </span>
          </div>

          {/* Detective */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#282218] border border-amber-500/20">
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-amber-300 stroke-[2.5] shrink-0" />
              <span className="text-xs font-medium text-white">Detective</span>
            </div>
            <span className="font-mono text-xs font-bold text-amber-200">
              {roles.detective}
            </span>
          </div>

          {/* Faithful */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#161f2c] border border-blue-500/20">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-blue-400 stroke-[2] shrink-0" />
              <span className="text-xs font-medium text-white">Faithful</span>
            </div>
            <span className="font-mono text-xs font-bold text-blue-300">
              {roles.faithful}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
