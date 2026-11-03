import React from "react";
import Image from "next/image";
import { CrownIcon } from "../CrownIcon";

interface WelcomeSectionProps {
  playerName: string;
}

export function WelcomeSection({ playerName }: WelcomeSectionProps) {
  return (
    <div className="relative w-full rounded-3xl bg-gradient-to-r from-[#170C1B]/80 via-[#1A0E22]/60 to-[#120A14]/90 border border-gold-antique/25 backdrop-blur-xl p-6 sm:p-8 flex items-center justify-between overflow-hidden shadow-[0_4px_30px_rgba(20,9,28,0.5)]">
      {/* Background Ambient Purple/Burgundy Glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 w-80 h-80 rounded-full bg-purple-glow/20 blur-3xl" />

      {/* Left: Greetings & Call to Action */}
      <div className="z-10 flex flex-col text-left max-w-xl">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="font-cormorant text-3xl sm:text-4xl lg:text-5xl font-normal text-text-main tracking-wide">
            Welcome back,{" "}
            <span className="font-semibold text-gold-gradient font-cinzel">
              {playerName}
            </span>
          </h1>
          <CrownIcon className="w-6 h-6 sm:w-7 sm:h-7 text-gold-antique drop-shadow-[0_0_10px_rgba(212,175,55,0.4)] shrink-0" />
        </div>

        <p className="font-cormorant italic text-base sm:text-lg text-text-secondary mt-2">
          &ldquo;Ready to outsmart, outplay and uncover the truth?&rdquo;
        </p>
      </div>

      {/* Right: The Architect Illustration with glowing circular halo */}
      <div className="hidden md:flex relative items-center justify-end w-56 h-36 shrink-0 pointer-events-none select-none">
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#170C1B]/90 z-10" />
        <div className="relative w-48 h-36">
          <Image
            src="/images/architect_character.png"
            alt="The Architect"
            width={444}
            height={280}
            priority
            className="w-full h-full object-contain object-top drop-shadow-[0_0_25px_rgba(139,74,168,0.35)]"
          />
        </div>
      </div>
    </div>
  );
}
