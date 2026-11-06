"use client";

import React from "react";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { MorningPlayer } from "@/types/morningAnnouncement";

interface EliminatedPlayerCardProps {
  eliminatedPlayer: MorningPlayer | null;
}

export function EliminatedPlayerCard({
  eliminatedPlayer,
}: EliminatedPlayerCardProps) {
  if (!eliminatedPlayer) {
    return (
      <div className="my-6 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 rounded-full bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center mb-3 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
          <ShieldCheck className="w-10 h-10 text-emerald-400 animate-pulse" />
        </div>
        <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-emerald-300 tracking-wide">
          Everyone Survived the Night
        </h3>
        <p className="text-xs sm:text-sm font-sans text-text-secondary mt-1 max-w-sm leading-relaxed">
          The council remains intact. No player fell during the shadows.
        </p>
      </div>
    );
  }

  return (
    <div className="my-6 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
      {/* 1. Large Grayscale Circular Avatar */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-white/20 grayscale shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
        <Image
          src={eliminatedPlayer.avatarUrl}
          alt={eliminatedPlayer.name}
          fill
          unoptimized
          className="object-cover"
        />
      </div>

      {/* 2. Player Username */}
      <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-[#F5EEDC] tracking-wide mt-3.5">
        {eliminatedPlayer.name}
      </h3>

      {/* 3. Red ELIMINATED Pill Badge */}
      <div className="mt-2.5 px-6 py-1.5 rounded-full bg-gradient-to-r from-red-950 via-rose-900 to-red-950 border border-red-500/60 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
        <span className="font-cinzel text-xs sm:text-sm font-extrabold tracking-[0.25em] text-red-200 uppercase">
          ELIMINATED
        </span>
      </div>
    </div>
  );
}
