"use client";

import React, { useState } from "react";
import Image from "next/image";
import { BanishedPlayer } from "@/types/votingResults";
import { Sparkles, Shield, Skull, Eye, EyeOff } from "lucide-react";

interface BanishmentRevealCardProps {
  banishedPlayer: BanishedPlayer;
  isRoleRevealed: boolean;
  onReveal: () => void;
  onHide: () => void;
}

export function BanishmentRevealCard({
  banishedPlayer,
  isRoleRevealed,
  onReveal,
  onHide,
}: BanishmentRevealCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleRevealClick = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onReveal();
      setIsAnimating(false);
    }, 600);
  };

  const isTraitor = banishedPlayer.isTraitor;

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-[#120A14]/90 backdrop-blur-xl p-6 sm:p-8 flex flex-col items-center justify-between text-center shadow-[0_4px_30px_rgba(20,9,28,0.5)] min-h-[440px] relative overflow-hidden">
      {/* Background ambient glow based on revealed allegiance */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-1000 ${
          isRoleRevealed
            ? isTraitor
              ? "opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-600 via-transparent to-transparent"
              : "opacity-25 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-600 via-transparent to-transparent"
            : "opacity-15 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-glow via-transparent to-transparent"
        }`}
      />

      {/* 1. Header: The Circle of Truth */}
      <div className="flex flex-col items-center mb-4 z-10">
        <span className="text-[11px] font-cinzel font-semibold tracking-[0.25em] text-gold-antique uppercase">
          The Circle of Truth
        </span>
        <h2 className="font-cormorant text-2xl sm:text-3xl font-bold tracking-wide text-gold-light mt-0.5">
          Final Declaration
        </h2>
      </div>

      {/* 2. Banished Player Profile & Spotlight */}
      <div className="my-auto py-2 flex flex-col items-center z-10 w-full max-w-md">
        {/* Avatar with dynamic ring */}
        <div
          className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden transition-all duration-700 ${
            isRoleRevealed
              ? isTraitor
                ? "ring-4 ring-red-500 shadow-[0_0_40px_rgba(239,68,68,0.7)]"
                : "ring-4 ring-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.7)]"
              : "ring-2 ring-gold-antique/50 shadow-[0_0_25px_rgba(212,175,55,0.3)] animate-pulse"
          }`}
        >
          <Image
            src={banishedPlayer.avatarUrl}
            alt={banishedPlayer.name}
            fill
            unoptimized
            className={`object-cover transition-all duration-700 ${
              isRoleRevealed ? "scale-105" : "grayscale"
            }`}
          />
        </div>

        {/* Player Name & Votes Received */}
        <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-[#F5EEDC] tracking-wide mt-3.5">
          {banishedPlayer.name}
        </h3>
        <p className="text-xs font-sans text-text-secondary/70 mt-0.5">
          Banished by {banishedPlayer.votesReceived} of {banishedPlayer.totalVotesCast} council votes
        </p>

        {/* 3. Role Reveal Content */}
        {!isRoleRevealed ? (
          <div className="mt-6 flex flex-col items-center">
            <div className="px-4 py-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs font-sans text-purple-200 max-w-xs text-center mb-5">
              The council has delivered their judgment. Step forward and disclose your true allegiance.
            </div>

            <button
              type="button"
              onClick={handleRevealClick}
              disabled={isAnimating}
              className="py-3 px-8 rounded-2xl bg-gradient-to-r from-gold-light via-[#F3DEAA] to-gold-antique hover:from-gold-antique hover:to-gold-light text-[#09060D] font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 shadow-[0_0_25px_rgba(242,216,154,0.35)] hover:shadow-[0_0_35px_rgba(212,175,55,0.45)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <Eye className="w-4 h-4 text-[#09060D]" />
              <span>{isAnimating ? "Unveiling..." : "Reveal True Allegiance"}</span>
            </button>
          </div>
        ) : (
          <div className="mt-5 flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
            {/* Dramatic Allegiance Badge */}
            <div
              className={`px-6 py-2 rounded-full border shadow-lg flex items-center gap-2.5 mb-3.5 ${
                isTraitor
                  ? "bg-gradient-to-r from-red-950 via-rose-900 to-red-950 border-red-500/80 shadow-[0_0_30px_rgba(220,38,38,0.5)]"
                  : "bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 border-emerald-500/80 shadow-[0_0_30px_rgba(16,185,129,0.5)]"
              }`}
            >
              {isTraitor ? (
                <Skull className="w-5 h-5 text-red-400" />
              ) : (
                <Shield className="w-5 h-5 text-emerald-300" />
              )}
              <span
                className={`font-cinzel text-sm sm:text-base font-extrabold tracking-[0.25em] uppercase ${
                  isTraitor ? "text-red-200" : "text-emerald-200"
                }`}
              >
                {banishedPlayer.role}
              </span>
            </div>

            {/* Confession Quote Bubble */}
            <div className="relative p-4 rounded-2xl bg-[#1A0E1C]/90 border border-gold-antique/25 max-w-sm shadow-inner text-center">
              <Sparkles className="w-3.5 h-3.5 text-gold-antique absolute top-2.5 left-3" />
              <p className="text-xs sm:text-sm font-cormorant italic text-gold-light/95 leading-relaxed pt-1">
                &ldquo;{banishedPlayer.confession}&rdquo;
              </p>
            </div>

            {/* Reset / Hide Toggle for Evaluator Convenience */}
            <button
              type="button"
              onClick={onHide}
              className="mt-3 text-[11px] font-sans text-text-secondary/50 hover:text-text-secondary flex items-center gap-1 transition-colors"
            >
              <EyeOff className="w-3 h-3" />
              <span>Hide Reveal</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Bottom Note */}
      <div className="z-10 mt-2 text-[11px] font-mono text-text-secondary/50">
        Article IV, Banishment Protocol — The Architect&apos;s Decree
      </div>
    </div>
  );
}

