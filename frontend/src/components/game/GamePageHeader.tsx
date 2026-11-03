import React from "react";
import Image from "next/image";

export function GamePageHeader() {
  return (
    <div className="relative w-full max-w-6xl mx-auto pt-6 pb-4 sm:pb-6 flex items-center justify-between z-10">
      {/* Centered Heading and Subtitle */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <h1 className="font-cinzel text-2xl sm:text-4xl md:text-5xl font-bold tracking-[0.14em] sm:tracking-[0.18em] text-text-main drop-shadow-[0_4px_16px_rgba(212,175,55,0.2)]">
          CREATE OR JOIN A GAME
        </h1>

        {/* Decorative Diamond Divider */}
        <div className="flex items-center justify-center gap-2.5 my-2.5 opacity-80">
          <div className="h-[1px] w-10 sm:w-16 bg-gradient-to-r from-transparent to-gold-antique/60" />
          <div className="w-1.5 h-1.5 rotate-45 border border-gold-antique bg-gold-antique/40 shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
          <div className="h-[1px] w-10 sm:w-16 bg-gradient-to-l from-transparent to-gold-antique/60" />
        </div>

        {/* Subtitle */}
        <p className="font-cormorant italic text-sm sm:text-base md:text-lg text-text-secondary tracking-wide">
          &ldquo;Gather your allies (or rivals) and step into the game.&rdquo;
        </p>
      </div>

      {/* Right Side Subtle Architect Illustration */}
      <div className="hidden lg:flex absolute right-0 top-0 items-center justify-end w-48 h-32 pointer-events-none select-none">
        <div className="pointer-events-none absolute w-52 h-52 rounded-full bg-purple-glow/20 blur-2xl -top-6 right-2" />
        <div className="relative w-40 h-28 opacity-90 drop-shadow-[0_0_20px_rgba(139,74,168,0.3)]">
          <Image
            src="/images/architect_character.png"
            alt="The Architect"
            width={444}
            height={280}
            priority
            className="w-full h-full object-contain object-top"
          />
        </div>
      </div>
    </div>
  );
}
