import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CrownIcon } from "../CrownIcon";

interface LeftBrandingProps {
  mode: "login" | "register" | "forgot";
}

export function LeftBranding({ mode }: LeftBrandingProps) {
  const getHeading = () => {
    switch (mode) {
      case "register":
        return "Join the Council";
      case "forgot":
        return "Council Recovery";
      case "login":
      default:
        return "Welcome Back";
    }
  };

  const getTagline = () => {
    switch (mode) {
      case "register":
        return "Claim your secret identity and enter the arena of deception.";
      case "forgot":
        return "Restore your passage into the domain of The Architect.";
      case "login":
      default:
        return "Re-enter the game of strategy, deception and intelligence.";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-md mx-auto select-none py-6">
      {/* 1. Hooded Architect Character Visual with Glowing Halo */}
      <div className="relative flex flex-col items-center justify-center mb-[-12px]">
        {/* Ambient Halo & Purple Chiaroscuro Glow */}
        <div className="pointer-events-none absolute -top-4 w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-gradient-to-b from-purple-glow/25 via-burgundy-deep/20 to-transparent blur-3xl opacity-80" />

        {/* Character Image */}
        <div className="relative w-64 h-44 sm:w-72 sm:h-48 drop-shadow-[0_0_25px_rgba(139,74,168,0.3)]">
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

      {/* 2. Crown Logo */}
      <Link href="/" className="group flex flex-col items-center gap-1 z-10">
        <CrownIcon className="w-7 h-7 text-gold-antique transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
      </Link>

      {/* 3. Main Brand Heading */}
      <h1 className="font-cinzel text-3xl sm:text-4xl font-bold tracking-[0.18em] text-gold-gradient mt-2.5 drop-shadow-[0_4px_16px_rgba(212,175,55,0.25)]">
        AI TRAITORS
      </h1>

      {/* 4. Subtitle: THE ARCHITECT */}
      <div className="flex items-center justify-center gap-3 mt-1.5 w-full">
        <div className="h-[1px] w-12 sm:w-16 bg-gradient-to-r from-transparent to-gold-antique/70" />
        <span className="font-cinzel text-[11px] sm:text-xs tracking-[0.35em] text-gold-antique font-semibold">
          THE ARCHITECT
        </span>
        <div className="h-[1px] w-12 sm:w-16 bg-gradient-to-l from-transparent to-gold-antique/70" />
      </div>

      {/* 5. Mode Heading (Welcome Back / Join the Council) */}
      <h2 className="font-cormorant text-2xl sm:text-3xl text-text-main font-normal tracking-wide mt-6 sm:mt-7">
        {getHeading()}
      </h2>

      {/* 6. Tagline */}
      <p className="font-cormorant italic text-sm sm:text-base text-text-secondary max-w-xs sm:max-w-sm mt-1.5 leading-relaxed">
        {getTagline()}
      </p>

      {/* 7. Decorative Diamond Divider */}
      <div className="flex items-center justify-center gap-2.5 mt-4 opacity-75">
        <div className="h-[1px] w-10 sm:w-14 bg-gradient-to-r from-transparent to-gold-antique/50" />
        <div className="w-1.5 h-1.5 rotate-45 border border-gold-antique bg-gold-antique/30" />
        <div className="h-[1px] w-10 sm:w-14 bg-gradient-to-l from-transparent to-gold-antique/50" />
      </div>
    </div>
  );
}
