"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Radio, ToggleLeft, ToggleRight } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MorningPlayerList } from "./MorningPlayerList";
import { MorningHeader } from "./MorningHeader";
import { MorningAnnouncementBanner } from "./MorningAnnouncementBanner";
import { EliminatedPlayerCard } from "./EliminatedPlayerCard";
import { useMorningAnnouncement } from "@/hooks/useMorningAnnouncement";
import { MOCK_PLAYER_PROFILE } from "@/services/dashboard";

interface MorningContainerProps {
  roomCode?: string;
  roundNumber?: number;
}

export function MorningContainer({
  roomCode = "A7K4D9",
  roundNumber = 2,
}: MorningContainerProps) {
  const router = useRouter();
  const { state, toggleEliminationScenario } = useMorningAnnouncement(
    roomCode,
    roundNumber
  );

  const [navigating, setNavigating] = useState(false);

  const handleContinue = () => {
    if (navigating) return;
    setNavigating(true);
    setTimeout(() => {
      router.push(`/game/discussion?room=${state.roomCode}&round=${state.roundNumber}`);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col selection:bg-purple-muted selection:text-gold-light relative overflow-x-hidden">
      {/* 1. Cinematic Background Vignette & Fog Layers */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-75"
        style={{
          background:
            "radial-gradient(ellipse 95% 75% at 50% 12%, #24101F 0%, #120A14 45%, #09060D 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -top-24 -left-20 w-[500px] h-[400px] rounded-full bg-purple-muted/15 blur-[140px] z-0"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-28 -right-20 w-[500px] h-[400px] rounded-full bg-burgundy-deep/25 blur-[140px] z-0"
        aria-hidden="true"
      />

      {/* 2. Top Navigation Bar (Reused Master Header) */}
      <DashboardHeader activeNav="dashboard" profile={MOCK_PLAYER_PROFILE} />

      {/* 3. Main Master 2-Column Layout */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 z-10 flex flex-col justify-between gap-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
          {/* LEFT COLUMN: Player List (3 cols on lg = ~25% width) */}
          <div className="lg:col-span-3 flex flex-col">
            <MorningPlayerList players={state.players} />
          </div>

          {/* CENTRE COLUMN: Morning Announcement & Elimination Reveal (9 cols on lg = ~75% width) */}
          <div className="lg:col-span-9 flex flex-col items-center justify-between py-2 sm:py-4 text-center">
            {/* Morning Announcement Header */}
            <MorningHeader
              roundNumber={state.roundNumber}
              phaseType={state.phaseType}
            />

            {/* The Architect Announcement Banner */}
            <MorningAnnouncementBanner
              eliminatedPlayer={state.eliminatedPlayer}
            />

            {/* Eliminated Player Profile Display */}
            <EliminatedPlayerCard
              eliminatedPlayer={state.eliminatedPlayer}
            />

            {/* Primary Action Button: Continue to Discussion → */}
            <div className="w-full sm:w-80 mt-2 mb-4">
              <button
                type="button"
                onClick={handleContinue}
                disabled={navigating}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-gold-light via-[#F3DEAA] to-gold-antique hover:from-gold-antique hover:to-gold-light text-[#09060D] font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 shadow-[0_0_25px_rgba(242,216,154,0.35)] hover:shadow-[0_0_35px_rgba(212,175,55,0.45)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              >
                {navigating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-[#09060D]" />
                    <span>Convening Council...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Discussion</span>
                    <ArrowRight className="w-4 h-4 text-[#09060D] stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 4. Evaluator & Demonstration Toolbar */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gold-antique/10 text-[11px] font-sans text-text-secondary/70">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-gold-antique animate-pulse" />
            <span className="text-gold-light/80">Authoritative Event Engine:</span>
            <span className="bg-[#1A0E1C] px-2 py-0.5 rounded border border-gold-antique/25 font-mono text-[10px] text-text-main">
              {state.connectionStatus === "connected"
                ? "Live WebSocket"
                : "Mock Evaluation Adapter"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-text-secondary/50">Evaluation Scenario:</span>
            <button
              onClick={toggleEliminationScenario}
              className="px-2.5 py-1 rounded bg-[#1A0E1C] hover:bg-[#251528] border border-gold-antique/20 text-gold-light text-[10px] flex items-center gap-1.5 transition"
              title="Toggle between Arnav eliminated and No elimination scenario"
            >
              {state.eliminatedPlayer ? (
                <>
                  <ToggleRight className="w-3.5 h-3.5 text-rose-400" />
                  <span>Showing: Arnav Eliminated (Click to test No-Elimination)</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Showing: No Elimination (Click to test Arnav Eliminated)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
