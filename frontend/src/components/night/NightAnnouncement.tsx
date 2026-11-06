"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface NightAnnouncementProps {
  announcementText: string;
}

export function NightAnnouncement({ announcementText }: NightAnnouncementProps) {
  return (
    <div className="w-full my-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#2B1038] via-[#210D2C] to-[#16091F] border border-[#8B4AA8]/40 shadow-sm flex items-start sm:items-center gap-3.5 text-left">
      <div className="w-8 h-8 rounded-xl bg-purple-900/40 border border-purple-400/40 flex items-center justify-center shrink-0 text-purple-300">
        <Sparkles className="w-4 h-4 fill-current text-purple-300" />
      </div>
      <div>
        <h3 className="font-cinzel text-xs sm:text-sm font-bold tracking-wider text-[#C084FC]">
          THE ARCHITECT
        </h3>
        <p className="text-xs sm:text-sm font-sans text-text-secondary leading-relaxed mt-0.5">
          {announcementText}
        </p>
      </div>
    </div>
  );
}
