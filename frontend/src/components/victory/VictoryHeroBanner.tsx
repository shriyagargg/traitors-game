"use client";

import React from "react";
import Image from "next/image";
import { VictoryOutcome } from "@/types/victory";
import { ShieldCheck, Skull, Coins, Sparkles } from "lucide-react";

interface VictoryHeroBannerProps {
  outcome: VictoryOutcome;
  winningFaction: string;
  prizePool: string;
  architectVerdict: string;
}

export function VictoryHeroBanner({
  outcome,
  winningFaction,
  prizePool,
  architectVerdict,
}: VictoryHeroBannerProps) {
  const isFaithful = outcome === "FAITHFUL_VICTORY";

  return (
    <div
      className={`w-full rounded-3xl border p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden transition-all duration-700 shadow-[0_4px_30px_rgba(20,9,28,0.6)] ${
        isFaithful
          ? "border-gold-antique/40 bg-gradient-to-b from-[#1E1428]/95 via-[#140C1A]/95 to-[#0A060E]/95"
          : "border-red-500/40 bg-gradient-to-b from-[#250B15]/95 via-[#160810]/95 to-[#0A0408]/95"
      }`}
    >
      {/* Background Ambient Aura */}
      <div
        className={`pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[550px] h-[300px] rounded-full blur-[120px] ${
          isFaithful
            ? "bg-gradient-to-b from-gold-antique/25 via-emerald-500/15 to-transparent"
            : "bg-gradient-to-b from-red-600/25 via-purple-glow/20 to-transparent"
        }`}
      />

      {/* 1. Crest Icon */}
      <div
        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-300 ${
          isFaithful
            ? "bg-gold-antique/15 border-2 border-gold-antique/60 shadow-[0_0_35px_rgba(212,175,55,0.45)] text-gold-light"
            : "bg-red-950/40 border-2 border-red-500/60 shadow-[0_0_35px_rgba(220,38,38,0.5)] text-red-400"
        }`}
      >
        {isFaithful ? (
          <ShieldCheck className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse text-gold-light" />
        ) : (
          <Skull className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse text-red-400" />
        )}
      </div>

      {/* 2. Victory Heading */}
      <div className="z-10 flex flex-col items-center">
        <span
          className={`text-xs font-cinzel font-bold tracking-[0.3em] uppercase ${
            isFaithful ? "text-gold-antique" : "text-red-400"
          }`}
        >
          {isFaithful ? "Vigilance Triumphs" : "Deception Reigns"}
        </span>

        <h2 className="font-cinzel text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-wide text-[#F5EEDC] mt-1">
          {isFaithful ? "THE FAITHFUL PREVAIL" : "THE TRAITORS TRIUMPH"}
        </h2>

        <p className="text-xs sm:text-sm font-sans text-text-secondary mt-2 max-w-xl leading-relaxed">
          {isFaithful
            ? "Every shadow has been excised. The surviving Faithful have unmasked all Traitors and secured their freedom."
            : "The Council was blinded by distrust. The Traitors silently orchestrated every vote and seized total control of the castle."}
        </p>
      </div>

      {/* 3. Prize Bounty Badge */}
      <div className="z-10 mt-5 inline-flex items-center gap-2.5 px-5 py-2 rounded-2xl bg-[#1A0E1C]/90 border border-gold-antique/30 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
        <Coins className="w-4 h-4 text-gold-light" />
        <span className="text-xs font-sans text-text-secondary">Grand Prize Vault:</span>
        <span className="font-mono text-base font-extrabold text-gold-light tracking-wider">
          {prizePool}
        </span>
        <span className="text-xs font-cinzel text-gold-antique font-semibold">
          ({winningFaction})
        </span>
      </div>

      {/* 4. Architect Proclamation */}
      <div className="z-10 mt-6 w-full max-w-2xl p-4 rounded-2xl bg-[#140A18]/80 border border-purple-glow/30 flex items-start gap-3.5 text-left">
        <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-purple-400/40 shrink-0">
          <Image
            src="/images/architect_gameplay.png"
            alt="The Architect"
            fill
            unoptimized
            className="object-cover"
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <h4 className="font-cinzel text-xs font-bold tracking-wider text-purple-300 uppercase">
              The Architect&apos;s Chronicle
            </h4>
          </div>
          <p className="text-xs sm:text-sm font-cormorant italic text-[#F5EEDC]/90 mt-1 leading-relaxed">
            &ldquo;{architectVerdict}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

