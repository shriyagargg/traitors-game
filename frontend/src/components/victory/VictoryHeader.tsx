"use client";

import React from "react";
import { Trophy, Crown, Sparkles } from "lucide-react";

interface VictoryHeaderProps {
  roomCode: string;
  roundsPlayed: number;
}

export function VictoryHeader({ roomCode, roundsPlayed }: VictoryHeaderProps) {
  return (
    <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 gap-3 border-b border-gold-antique/15">
      {/* 1. Left: Trophy Icon, Title & Round */}
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-[#1A0E1C] border border-gold-antique/30 flex items-center justify-center shrink-0 shadow-inner">
          <Trophy className="w-6 h-6 text-gold-light" />
        </div>
        <div className="text-left">
          <h1 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-[0.16em] text-[#F5EEDC]">
            FINAL VERDICT
          </h1>
          <p className="text-xs sm:text-sm font-sans text-text-secondary/80 mt-0.5">
            Room {roomCode} — Concluded after {roundsPlayed} Rounds
          </p>
        </div>
      </div>

      {/* 2. Right: Game Status Badge */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gold-antique/10 border border-gold-antique/30 text-xs font-mono text-gold-light self-end sm:self-auto">
        <Crown className="w-3.5 h-3.5 text-gold-antique" />
        <span>ARCHITECT ARCHIVES</span>
      </div>
    </div>
  );
}

