"use client";

import React from "react";
import { Scale, Users, ShieldAlert } from "lucide-react";

interface VotingResultsHeaderProps {
  roundNumber: number;
  totalVotes: number;
  roomCode: string;
}

export function VotingResultsHeader({
  roundNumber,
  totalVotes,
  roomCode,
}: VotingResultsHeaderProps) {
  return (
    <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 gap-3 border-b border-gold-antique/15">
      {/* 1. Left: Scales Icon, Title & Round */}
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-[#1A0E1C] border border-gold-antique/30 flex items-center justify-center shrink-0 shadow-inner">
          <Scale className="w-6 h-6 text-gold-light" />
        </div>
        <div className="text-left">
          <h1 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-[0.16em] text-[#F5EEDC]">
            BANISHMENT CEREMONY
          </h1>
          <p className="text-xs sm:text-sm font-sans text-text-secondary/80 mt-0.5">
            Round {roundNumber} — Council Day Verdict
          </p>
        </div>
      </div>

      {/* 2. Right: Ballots Count & Room Badge */}
      <div className="flex items-center gap-3 self-end sm:self-auto">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#1A0E1C]/90 border border-gold-antique/30 text-xs font-mono text-gold-light">
          <Users className="w-3.5 h-3.5 text-gold-antique" />
          <span>{totalVotes} Ballots Cast</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs font-mono text-purple-200">
          <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
          <span>ROOM {roomCode}</span>
        </div>
      </div>
    </div>
  );
}

