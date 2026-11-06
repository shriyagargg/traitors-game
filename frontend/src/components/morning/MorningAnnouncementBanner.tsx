"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { MorningPlayer } from "@/types/morningAnnouncement";

interface MorningAnnouncementBannerProps {
  eliminatedPlayer: MorningPlayer | null;
}

export function MorningAnnouncementBanner({
  eliminatedPlayer,
}: MorningAnnouncementBannerProps) {
  return (
    <div className="w-full max-w-2xl mx-auto my-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#2B1038] via-[#210D2C] to-[#16091F] border border-[#8B4AA8]/40 shadow-[0_4px_30px_rgba(20,9,28,0.5)] flex items-center justify-center gap-4 text-center">
      <div className="w-10 h-10 rounded-2xl bg-purple-900/40 border border-purple-400/40 flex items-center justify-center shrink-0 text-purple-300">
        <Sparkles className="w-5 h-5 fill-current text-purple-300" />
      </div>

      <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
        <h3 className="font-cinzel text-xs sm:text-sm font-bold tracking-[0.2em] text-[#C084FC] uppercase">
          THE ARCHITECT
        </h3>
        <p className="text-xs sm:text-sm font-sans text-text-secondary mt-0.5">
          The night has ended.
        </p>

        <div className="mt-1 text-base sm:text-lg font-cormorant font-semibold text-[#F5EEDC]">
          {eliminatedPlayer ? (
            <span>
              <span className="font-cinzel font-bold text-gold-light text-lg sm:text-xl tracking-wide drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]">
                {eliminatedPlayer.name}
              </span>{" "}
              has been eliminated.
            </span>
          ) : (
            <span className="text-emerald-400 font-bold text-lg sm:text-xl">
              No player was eliminated.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
