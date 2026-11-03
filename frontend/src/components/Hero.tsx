"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Gamepad2, Users } from "lucide-react";

export function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center text-center w-full max-w-5xl mx-auto px-4 pt-4 sm:pt-6 z-10">
      {/* Central Character & Halo Visual Composition */}
      <div className="relative flex flex-col items-center justify-center mb-[-24px] sm:mb-[-32px] md:mb-[-40px]">
        {/* Soft atmospheric purple & gold ambient halo glow */}
        <div className="pointer-events-none absolute -top-8 w-72 h-72 sm:w-88 sm:h-88 md:w-96 md:h-96 rounded-full bg-gradient-to-b from-purple-glow/25 via-burgundy-deep/20 to-transparent blur-3xl opacity-75" />

        {/* The Architect: Hooded character with halo and glowing eyes */}
        <div className="relative w-72 h-48 sm:w-84 sm:h-56 md:w-[420px] md:h-64 select-none drop-shadow-[0_0_30px_rgba(139,74,168,0.25)]">
          <Image
            src="/images/architect_character.png"
            alt="The Architect — Autonomous Game Master"
            width={444}
            height={280}
            priority
            className="w-full h-full object-contain object-top"
          />
        </div>
      </div>

      {/* Main Heading: AI TRAITORS */}
      <h1 className="relative font-cinzel text-4xl sm:text-6xl md:text-7xl font-bold tracking-[0.16em] sm:tracking-[0.18em] text-gold-gradient select-none drop-shadow-[0_4px_20px_rgba(212,175,55,0.25)] z-20">
        AI TRAITORS
      </h1>

      {/* Subtitle: THE ARCHITECT flanked by thin horizontal gold lines */}
      <div className="relative flex items-center justify-center gap-3 sm:gap-4 mt-2.5 sm:mt-3 z-20">
        <div className="h-[1px] w-12 sm:w-20 md:w-24 bg-gradient-to-r from-transparent to-gold-antique/70" />
        <span className="font-cinzel text-xs sm:text-sm tracking-[0.32em] sm:tracking-[0.38em] text-gold-antique font-semibold">
          THE ARCHITECT
        </span>
        <div className="h-[1px] w-12 sm:w-20 md:w-24 bg-gradient-to-l from-transparent to-gold-antique/70" />
      </div>

      {/* Tagline */}
      <p className="relative font-cormorant italic text-base sm:text-xl md:text-2xl text-text-main font-normal tracking-wide mt-4 sm:mt-5 max-w-2xl mx-auto leading-relaxed z-20">
        &ldquo;The AI is not just playing the game. The AI is running the game.&rdquo;
      </p>

      {/* Primary Action CTA Buttons */}
      <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 mt-7 sm:mt-9 w-full max-w-md mx-auto z-20">
        {/* Button 1: Create a Game */}
        <Link
          href="/lobby/create"
          className="w-full sm:w-auto min-w-[200px] h-12 sm:h-13 px-7 rounded-xl bg-gold-light hover:bg-gold-antique text-background font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 shadow-[0_0_25px_rgba(242,216,154,0.35)] hover:shadow-[0_0_30px_rgba(212,175,55,0.45)] hover:scale-[1.02] active:scale-[0.99]"
        >
          <Gamepad2 className="w-5 h-5 text-background" />
          <span>Create a Game</span>
        </Link>

        {/* Button 2: Join a Game */}
        <Link
          href="/lobby/join"
          className="w-full sm:w-auto min-w-[200px] h-12 sm:h-13 px-7 rounded-xl bg-bg-secondary/70 hover:bg-bg-secondary border border-gold-antique/70 hover:border-gold-antique text-text-main font-medium text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 backdrop-blur-md shadow-[0_0_15px_rgba(212,175,55,0.12)] hover:shadow-[0_0_20px_rgba(212,175,55,0.22)] hover:scale-[1.02] active:scale-[0.99]"
        >
          <Users className="w-5 h-5 text-gold-antique" />
          <span>Join a Game</span>
        </Link>
      </div>
    </section>
  );
}
