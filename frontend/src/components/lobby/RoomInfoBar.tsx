"use client";

import React, { useState } from "react";
import { Users, Copy, Check, Lock, Globe, LogOut, Bot } from "lucide-react";
import { PlayerCapacity } from "@/services/rooms";

interface RoomInfoBarProps {
  roomName: string;
  roomCode: string;
  playerCount: number;
  maxCapacity: PlayerCapacity;
  isPrivate: boolean;
  isHost?: boolean;
  onLeaveLobby?: () => void;
  isLeaving?: boolean;
  onAddTestPlayers?: () => void;
  isAddingTestPlayers?: boolean;
}

export function RoomInfoBar({
  roomName,
  roomCode,
  playerCount,
  maxCapacity,
  isPrivate,
  isHost = false,
  onLeaveLobby,
  isLeaving = false,
  onAddTestPlayers,
  isAddingTestPlayers = false,
}: RoomInfoBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#19151d] p-4 sm:px-5 sm:py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_4px_30px_rgba(20,9,28,0.4)]">
      {/* 1. Left: Room Icon, Room Name & Room Code */}
      <div className="flex items-center gap-3.5 w-full md:w-auto">
        <div className="w-10 h-10 rounded-xl bg-[#2b2131] border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
          <Users className="w-5 h-5 text-[#c4a6d2]" />
        </div>

        <div className="flex flex-col text-left min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight truncate max-w-[200px] sm:max-w-xs">
            {roomName}
          </h2>
          {/* Room Code Badge & Copy Button */}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-[#b9b0bd]/80">Room Code:</span>
            <div className="flex items-center gap-1.5 bg-[#100d13] border border-white/10 px-2 py-0.5 rounded-lg">
              <span className="font-mono text-xs sm:text-sm font-bold text-gold-light tracking-wider select-all">
                {roomCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1 text-[#c4a6d2]/80 hover:text-white transition relative"
                title="Copy Room Code"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#120A14] border border-[#b99ca5]/40 text-gold-light text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-20">
                    Copied!
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle & Right: Capacity, Privacy & Leave Lobby */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
        {/* Capacity Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#211827] border border-white/10 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-[#c4a6d2]" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs sm:text-sm font-semibold text-white">
              {playerCount} / {maxCapacity} Players
            </span>
            <span className="text-[10px] text-[#b9b0bd]/70">
              {playerCount >= maxCapacity ? "Chamber is full" : `${maxCapacity - playerCount} slot${maxCapacity - playerCount > 1 ? "s" : ""} left`}
            </span>
          </div>
        </div>

        {/* Privacy Tag */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#211827] border border-white/10 flex items-center justify-center shrink-0">
            {isPrivate ? (
              <Lock className="w-3.5 h-3.5 text-[#c4a6d2]" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-[#c4a6d2]" />
            )}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs sm:text-sm font-semibold text-white">
              {isPrivate ? "Private Room" : "Public Room"}
            </span>
            <span className="text-[10px] text-[#b9b0bd]/70">
              {isPrivate ? "Code required" : "Open to all"}
            </span>
          </div>
        </div>

        {isHost && onAddTestPlayers && playerCount < maxCapacity && (
          <button type="button" onClick={onAddTestPlayers} disabled={isAddingTestPlayers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-400/30 bg-purple-950/30 text-xs font-semibold text-[#e2c4ec] hover:bg-purple-900/50 hover:border-purple-300/50 disabled:opacity-50 transition-all">
            <Bot className="w-3.5 h-3.5" />
            <span>{isAddingTestPlayers ? "Adding..." : "Add Test Players"}</span>
          </button>
        )}

        {/* Leave Lobby Action Button */}
        {onLeaveLobby && (
          <button
            type="button"
            onClick={onLeaveLobby}
            disabled={isLeaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-950/20 text-xs font-semibold text-rose-300 hover:bg-rose-900/40 hover:border-rose-400/60 active:scale-95 transition-all shadow-sm ml-auto md:ml-0"
            title="Leave this game lobby"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isLeaving ? "Leaving..." : "Leave Lobby"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
