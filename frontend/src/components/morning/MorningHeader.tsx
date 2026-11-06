"use client";

import React from "react";
import { Sunrise } from "lucide-react";

interface MorningHeaderProps {
  roundNumber: number;
  phaseType: string;
}

export function MorningHeader({ roundNumber, phaseType }: MorningHeaderProps) {
  return (
    <div className="flex items-center justify-center gap-3.5 my-2">
      <div className="w-11 h-11 rounded-2xl bg-[#1A0E1C] border border-gold-antique/30 flex items-center justify-center shrink-0 shadow-inner">
        <Sunrise className="w-6 h-6 text-gold-light" />
      </div>
      <div className="text-left">
        <h1 className="font-cinzel text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.16em] text-[#F5EEDC] drop-shadow-[0_2px_12px_rgba(212,175,55,0.2)]">
          MORNING ANNOUNCEMENT
        </h1>
        <p className="text-xs sm:text-sm font-sans text-text-secondary/80 mt-0.5">
          Round {roundNumber} — {phaseType}
        </p>
      </div>
    </div>
  );
}
