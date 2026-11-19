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
import { useGamePhaseGuard } from "@/hooks/useGamePhaseGuard";
import { getPlayerSession } from "@/services/playerSession";
import { getApiBaseUrl } from "@/services/rooms";

interface MorningContainerProps {
  roomCode?: string;
  roundNumber?: number;
}

export function MorningContainer({
  roomCode = "",
  roundNumber = 1,
}: MorningContainerProps) {
  useGamePhaseGuard(roomCode, "MORNING");
  const router = useRouter();
  const { state } = useMorningAnnouncement(
    roomCode,
    roundNumber
  );

  const [navigating, setNavigating] = useState(false);
  const [advanceError, setAdvanceError] = useState("");

  const handleContinue = async () => {
    if (navigating) return;
    setNavigating(true);
    setAdvanceError("");
    try {
      const session = getPlayerSession(state.roomCode);
      const response = await fetch(`${getApiBaseUrl()}/api/v1/game/${encodeURIComponent(state.roomCode)}/advance-phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: session.id,
          token: session.token,
          account_token: session.accountToken,
          expected_phase: "MORNING",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success || !result.phase) {
        throw new Error(result.detail || result.message || "The server could not open the discussion phase.");
      }
      const phaseRoutes: Record<string, string> = {
        DISCUSSION: "/game/discussion",
        VOTING: "/game/voting",
        VOTING_RESULTS: "/game/voting-results",
        GAME_OVER: "/game/victory",
      };
      const route = phaseRoutes[result.phase];
      if (!route) {
        throw new Error(`Unexpected game phase: ${String(result.phase || "unknown").toLowerCase().replaceAll("_", " ")}. Please try again.`);
      }
      router.push(`${route}?room=${encodeURIComponent(state.roomCode)}&round=${state.roundNumber}`);
    } catch (error) {
      setAdvanceError(error instanceof Error ? error.message : "The discussion phase could not be opened. Check your connection and try again.");
      setNavigating(false);
    }
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
      <DashboardHeader activeNav="dashboard" profile={{ name: getPlayerSession().name, email: getPlayerSession().email || "", avatarUrl: getPlayerSession().avatarUrl, roleBadge: "" }} />

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
              dynamicAnnouncement={state.dynamicAnnouncement}
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
              {advanceError && <p role="alert" className="mt-2 text-xs text-red-300">{advanceError}</p>}
            </div>
          </div>
        </div>


      </main>
    </div>
  );
}
