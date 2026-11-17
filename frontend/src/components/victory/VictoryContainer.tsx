"use client";

import React from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { VictoryHeader } from "./VictoryHeader";
import { VictoryHeroBanner } from "./VictoryHeroBanner";
import { RosterRoleRevealGrid } from "./RosterRoleRevealGrid";
import { MatchStatsSummary } from "./MatchStatsSummary";
import { VictoryActionButtons } from "./VictoryActionButtons";
import { useVictory } from "@/hooks/useVictory";
import { useGamePhaseGuard } from "@/hooks/useGamePhaseGuard";
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
  useGamePhaseGuard(roomCode, "GAME_OVER");
  const { state } = useVictory(roomCode, initialOutcome);

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


      </main>
    </div>
  );
}

