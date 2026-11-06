"use client";

import React from "react";
import Link from "next/link";
import { CrownIcon } from "../CrownIcon";

interface RevealTopHeaderProps {
  roomCode: string;
  roundNumber: number;
  playerName: string;
}

export function RevealTopHeader({
  roomCode,
  roundNumber,
  playerName,
}: RevealTopHeaderProps) {
  return (
    <header className="w-full border-b border-gold-antique/20 bg-[#09060D]/90 backdrop-blur-md px-6 sm:px-10 py-3.5 flex items-center justify-between z-30">
      {/* 1. Left: Branding */}
      <Link href="/" className="flex flex-col text-left group">
        <div className="flex items-center gap-2">
          <CrownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gold-antique group-hover:scale-105 transition-transform" />
          <span className="font-cinzel text-sm sm:text-base md:text-lg font-bold tracking-[0.16em] text-gold-gradient">
            AI TRAITORS
          </span>
        </div>
        <span className="font-cinzel text-[8px] sm:text-[9px] tracking-[0.3em] text-gold-antique/70 pl-6 sm:pl-7">
          THE ARCHITECT
        </span>
      </Link>

      {/* 2. Right: Match Status Metadata */}
      <div className="flex items-center text-xs sm:text-sm font-sans text-text-secondary">
        <div className="flex items-center gap-1.5">
          <span className="text-text-secondary/70">Room:</span>
          <span className="font-mono font-bold text-gold-light tracking-wider">
            {roomCode}
          </span>
        </div>

        <span className="text-gold-antique/30 mx-2 sm:mx-3">|</span>

        <div className="flex items-center gap-1.5">
          <span className="text-text-secondary/70">Round</span>
          <span className="font-semibold text-text-main">{roundNumber}</span>
        </div>

        <span className="text-gold-antique/30 mx-2 sm:mx-3">|</span>

        <div className="flex items-center gap-1.5">
          <span className="text-text-secondary/70">Player:</span>
          <span className="font-semibold text-gold-light">{playerName}</span>
        </div>
      </div>
    </header>
  );
}
