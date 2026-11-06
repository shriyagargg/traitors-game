"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export function LobbyHeader() {
  return (
    <div className="relative w-full flex items-center justify-between pb-6 pt-2">
      {/* 1. Left: Back to Dashboard */}
      <div className="z-10 flex-1 flex justify-start">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#120A14]/80 border border-gold-antique/30 text-text-secondary hover:text-gold-light hover:border-gold-antique/60 text-xs sm:text-sm font-medium transition duration-200 shadow-sm group"
        >
          <ArrowLeft className="w-4 h-4 text-gold-antique group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* 2. Center: Game Lobby Title, Separator & Subtitle */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
        <h1 className="font-cinzel text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.18em] text-[#F5EEDC] drop-shadow-[0_2px_12px_rgba(212,175,55,0.2)]">
          GAME LOBBY
        </h1>

        {/* Diamond Separator */}
        <div className="flex items-center justify-center gap-3 my-1.5 opacity-80">
          <div className="h-[1px] w-12 sm:w-16 bg-gradient-to-r from-transparent to-gold-antique/80" />
          <span className="text-gold-antique text-[10px] transform rotate-45 select-none">◆</span>
          <div className="h-[1px] w-12 sm:w-16 bg-gradient-to-l from-transparent to-gold-antique/80" />
        </div>

        <p className="text-xs sm:text-sm font-sans text-text-secondary/90 tracking-wide font-normal max-w-md">
          The room is ready. Gather your allies and prepare for deception.
        </p>
      </div>

      {/* 3. Right: Circular Hooded Architect Illustration */}
      <div className="z-10 flex-1 flex justify-end">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 flex items-center justify-center">
          {/* Subtle Outer Violet/Gold Halo */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-muted/30 to-gold-antique/20 blur-md pointer-events-none" />
          
          <div className="relative w-full h-full rounded-full overflow-hidden border border-gold-antique/40 shadow-[0_0_20px_rgba(139,74,168,0.35)]">
            <Image
              src="/images/architect_lobby_header.png"
              alt="The Architect"
              fill
              unoptimized
              className="object-cover scale-105"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
