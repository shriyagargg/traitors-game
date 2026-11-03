"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LeftBranding } from "./LeftBranding";
import { AuthCard, AuthMode } from "./AuthCard";

interface AuthPageContainerProps {
  defaultMode?: AuthMode;
}

export function AuthPageContainer({ defaultMode = "login" }: AuthPageContainerProps) {
  const [currentMode, setCurrentMode] = useState<AuthMode>(defaultMode);

  return (
    <main className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-background text-text-main selection:bg-purple-muted selection:text-gold-light">
      {/* 1. Cinematic Background Atmospheric Layers */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-65"
        style={{
          background:
            "radial-gradient(ellipse 95% 75% at 50% 20%, #24101F 0%, #120A14 45%, #09060D 100%)",
        }}
        aria-hidden="true"
      />

      {/* 2. Soft Plum & Mist Glow in Lower Corners matching reference */}
      <div
        className="pointer-events-none fixed -bottom-24 -left-20 w-[500px] h-[360px] rounded-full bg-purple-muted/15 blur-[130px] z-0"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-24 -right-20 w-[500px] h-[360px] rounded-full bg-burgundy-deep/25 blur-[130px] z-0"
        aria-hidden="true"
      />

      {/* 3. Top Navigation Link: Return to Main Sanctum */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-12 pt-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-sans tracking-wide text-text-secondary hover:text-gold-light transition group"
        >
          <ArrowLeft className="w-4 h-4 text-gold-antique transition-transform group-hover:-translate-x-1" />
          <span>Return to AI TRAITORS</span>
        </Link>
      </div>

      {/* 4. Main 2-Column Authentication Layout */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12 my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: ~45% (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <LeftBranding mode={currentMode} />
        </div>

        {/* Right Column: ~55% (7 cols on lg) */}
        <div className="lg:col-span-7 flex items-center justify-center w-full">
          <AuthCard initialMode={defaultMode} onModeChange={(mode) => setCurrentMode(mode)} />
        </div>
      </div>

      {/* 5. Minimal Bottom Footer Note */}
      <footer className="relative z-20 py-5 text-center text-[11px] sm:text-xs font-sans text-text-secondary/50 tracking-wider">
        AI TRAITORS • The Architect — Autonomous Multi-Agent Platform
      </footer>
    </main>
  );
}
