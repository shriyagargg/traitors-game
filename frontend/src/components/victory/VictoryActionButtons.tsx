"use client";

import React, { useState } from "react";
import Link from "next/link";
import { RotateCcw, LayoutDashboard, Share2, Check } from "lucide-react";

interface VictoryActionButtonsProps {
  roomCode: string;
  winningFaction: string;
}

export function VictoryActionButtons({
  roomCode,
  winningFaction,
}: VictoryActionButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      const shareText = `AI Traitors: The Architect — Room ${roomCode} concluded with a victory for ${winningFaction}! Can you outsmart the AI Architect? Play now: ${window.location.origin}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // ignore clipboard error
    }
  };

  return (
    <div className="w-full flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gold-antique/15">
      {/* Secondary Navigation */}
      <Link
        href="/dashboard"
        className="text-xs font-sans text-text-secondary/80 hover:text-gold-light flex items-center gap-2 transition-colors px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-gold-antique/30"
      >
        <LayoutDashboard className="w-4 h-4 text-gold-antique" />
        <span>Return to Dashboard</span>
      </Link>

      {/* Main Action CTAs */}
      <div className="flex items-center gap-3">
        {/* Share chronicles button */}
        <button
          type="button"
          onClick={handleShare}
          className="px-4 py-3 rounded-2xl bg-[#1A0E1C] border border-gold-antique/30 text-xs font-sans text-gold-light hover:bg-[#251328] flex items-center gap-2 transition-all"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">Chronicle Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-gold-antique" />
              <span>Share Chronicles</span>
            </>
          )}
        </button>

        {/* Play Again CTA */}
        <Link
          href="/lobby/create"
          className="py-3 px-6 rounded-2xl bg-gradient-to-r from-gold-light via-[#F3DEAA] to-gold-antique hover:from-gold-antique hover:to-gold-light text-[#09060D] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_25px_rgba(242,216,154,0.35)] hover:shadow-[0_0_35px_rgba(212,175,55,0.45)] hover:scale-[1.02] active:scale-[0.98]"
        >
          <RotateCcw className="w-4 h-4 text-[#09060D]" />
          <span>Enter a New Castle</span>
        </Link>
      </div>
    </div>
  );
}

