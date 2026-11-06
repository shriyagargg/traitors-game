"use client";

import React from "react";
import Image from "next/image";
import { Sun } from "lucide-react";

interface DiscussionArchitectPanelProps {
  roundNumber: number;
  phaseName: string;
  phaseType: string;
}

export function DiscussionArchitectPanel({
  roundNumber,
  phaseName,
  phaseType,
}: DiscussionArchitectPanelProps) {
  return (
    <div className="w-full h-full rounded-3xl border border-white/10 bg-[#120A14]/90 backdrop-blur-xl p-6 flex flex-col items-center justify-center text-center shadow-[0_4px_30px_rgba(20,9,28,0.5)] transition-all">
      {/* 1. Hooded Circular Architect Illustration */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 flex items-center justify-center">
        {/* Soft Violet/Gold Halo */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-muted/30 to-gold-antique/25 blur-md pointer-events-none" />

        <div className="relative w-full h-full rounded-full overflow-hidden border border-gold-antique/50 shadow-[0_0_25px_rgba(139,74,168,0.35)]">
          <Image
            src="/images/architect_gameplay.png"
            alt="The Architect"
            fill
            unoptimized
            className="object-cover scale-105"
          />
        </div>
      </div>

      {/* 2. Identity Heading & Subtitle */}
      <div className="mt-4 mb-5">
        <h2 className="font-cinzel text-xl sm:text-2xl font-bold tracking-[0.18em] text-[#F5EEDC]">
          THE ARCHITECT
        </h2>
        <span className="font-cinzel text-[10px] tracking-[0.28em] text-gold-antique font-semibold block mt-1">
          — AI GAME MASTER —
        </span>
      </div>

      {/* 3. Thin Subtle Divider */}
      <div className="w-3/4 h-[1px] bg-gradient-to-r from-transparent via-gold-antique/25 to-transparent my-2" />

      {/* 4. Current Phase Metadata */}
      <div className="flex flex-col items-center justify-center mt-3">
        <div className="flex items-center gap-2 mb-1">
          <Sun className="w-5 h-5 text-amber-400 stroke-[2.2]" />
          <span className="text-xs font-sans text-gold-light font-semibold tracking-wide">
            Current Phase
          </span>
        </div>

        <span className="font-sans text-base sm:text-lg font-bold text-[#C084FC]">
          {phaseName} ({phaseType})
        </span>

        <span className="text-xs font-sans text-text-secondary/70 mt-3 font-medium">
          Round {roundNumber} of ∞
        </span>
      </div>
    </div>
  );
}
