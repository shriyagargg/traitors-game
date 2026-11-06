"use client";

import React from "react";

export function RevealPageHeading() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4 my-2 sm:my-4 z-10">
      <h1 className="font-cinzel text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.16em] text-[#F5EEDC] drop-shadow-[0_2px_15px_rgba(212,175,55,0.25)]">
        YOUR IDENTITY HAS BEEN DECIDED
      </h1>

      {/* Diamond Separator */}
      <div className="flex items-center justify-center gap-3 my-2 opacity-85">
        <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent to-gold-antique/80" />
        <span className="text-gold-antique text-xs transform rotate-45 select-none">◆</span>
        <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-l from-transparent to-gold-antique/80" />
      </div>

      <p className="font-cormorant italic text-base sm:text-lg text-text-secondary/90 tracking-wide font-normal max-w-lg">
        Keep it secret. Play it smart. The game begins now.
      </p>
    </div>
  );
}
