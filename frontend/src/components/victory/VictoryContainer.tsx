"use client";

import React from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { VictoryHeader } from "./VictoryHeader";
import { VictoryHeroBanner } from "./VictoryHeroBanner";
import { RosterRoleRevealGrid } from "./RosterRoleRevealGrid";
import { MatchStatsSummary } from "./MatchStatsSummary";
import { VictoryActionButtons } from "./VictoryActionButtons";
import { useVictory } from "@/hooks/useVictory";
import { MOCK_PLAYER_PROFILE } from "@/services/dashboard";
import { VictoryOutcome } from "@/types/victory";
import { Radio, Shield, Skull } from "lucide-react";

interface VictoryContainerProps {
  roomCode?: string;
  initialOutcome?: VictoryOutcome;
}

export function VictoryContainer({
  roomCode = "A7K4D9",
  initialOutcome = "FAITHFUL_VICTORY",
}: VictoryContainerProps) {
  const { state, setOutcome } = useVictory(roomCode, initialOutcome);

  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col selection:bg-purple-muted selection:text-gold-light relative overflow-x-hidden">
      {/* 1. Cinematic Background Vignette & Ambient Glows */}
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

      {/* 2. Top Navigation Bar */}
      <DashboardHeader activeNav="dashboard" profile={MOCK_PLAYER_PROFILE} />

      {/* 3. Main Victory Content Layout */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 z-10 flex flex-col justify-between gap-6">
        {/* Victory Header */}
        <VictoryHeader
          roomCode={state.roomCode}
          roundsPlayed={state.roundsPlayed}
        />

        {/* Hero Banner: Faction Victory & Architect Chronicle */}
        <VictoryHeroBanner
          outcome={state.outcome}
          winningFaction={state.winningFaction}
          prizePool={state.prizePool}
          architectVerdict={state.architectVerdict}
        />

        {/* Roster Unmasking: Secret Roles of All Players Revealed */}
        <RosterRoleRevealGrid players={state.revealedPlayers} />

        {/* Match Statistics Overview */}
        <MatchStatsSummary stats={state.stats} />

        {/* Action Buttons: Play Again & Dashboard */}
        <VictoryActionButtons
          roomCode={state.roomCode}
          winningFaction={state.winningFaction}
        />

        {/* 4. Evaluator & Demonstration Toolbar */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gold-antique/10 text-[11px] font-sans text-text-secondary/70">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-gold-antique animate-pulse" />
            <span className="font-mono text-gold-light uppercase tracking-wider">
              Mode: {state.connectionStatus}
            </span>
            <span className="text-white/20">|</span>
            <span>Page 12: End Game &amp; Victory Screen</span>
          </div>

          {/* Demo Controls: Toggle between Faithful Victory & Traitor Victory */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono text-text-secondary/50">
              Faction Toggle:
            </span>

            <button
              type="button"
              onClick={() => setOutcome("FAITHFUL_VICTORY")}
              className={`px-3 py-1 rounded-lg border text-[10px] font-mono flex items-center gap-1.5 transition-all ${
                state.outcome === "FAITHFUL_VICTORY"
                  ? "bg-emerald-950/70 border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  : "bg-black/40 border-white/10 hover:border-white/20 text-text-secondary"
              }`}
            >
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Faithful Victory</span>
            </button>

            <button
              type="button"
              onClick={() => setOutcome("TRAITOR_VICTORY")}
              className={`px-3 py-1 rounded-lg border text-[10px] font-mono flex items-center gap-1.5 transition-all ${
                state.outcome === "TRAITOR_VICTORY"
                  ? "bg-red-950/70 border-red-500/60 text-red-300 shadow-[0_0_12px_rgba(220,38,38,0.3)]"
                  : "bg-black/40 border-white/10 hover:border-white/20 text-text-secondary"
              }`}
            >
              <Skull className="w-3 h-3 text-red-400" />
              <span>Traitor Victory</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

