"use client";

import React from "react";
import { Clock, Vote, Scale } from "lucide-react";

interface VotingHeaderProps {
  roundNumber: number;
  formattedTimer: string;
  onProceedToResults?: () => void;
}

export function VotingHeader({
  roundNumber,
  formattedTimer,
  onProceedToResults,
}: VotingHeaderProps) {
  return (
    <div className="w-full flex items-center justify-between pb-3">
      {/* 1. Left: Ballot Box Icon, Title & Round */}
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-[#1A0E1C] border border-gold-antique/30 flex items-center justify-center shrink-0 shadow-inner">
          <Vote className="w-6 h-6 text-gold-light" />
        </div>
        <div className="text-left">
          <h1 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-[0.16em] text-[#F5EEDC]">
            VOTING PHASE
          </h1>
          <p className="text-xs sm:text-sm font-sans text-text-secondary/80 mt-0.5">
            Round {roundNumber} — Day
          </p>
        </div>
      </div>

      {/* 2. Right: Timer Card & Quick Proceed */}
      <div className="flex items-center gap-3">
        {onProceedToResults && (
          <button
            type="button"
            onClick={onProceedToResults}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold-antique/15 hover:bg-gold-antique/25 border border-gold-antique/40 text-gold-light text-xs font-semibold transition-all hover:scale-105 active:scale-95"
          >
            <span>Tally Results</span>
            <Scale className="w-3.5 h-3.5 text-gold-antique" />
          </button>
        )}

        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#1A0E1C]/90 border border-gold-antique/40 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
          <Clock className="w-6 h-6 text-gold-antique animate-pulse shrink-0" />
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-sans text-text-secondary/70 uppercase tracking-wider">
              Time Left
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-bold text-[#F5EEDC] tracking-wider leading-none mt-0.5">
              {formattedTimer}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
