"use client";

import React from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { VotingResultsHeader } from "./VotingResultsHeader";
import { VotingResultsAnnouncement } from "./VotingResultsAnnouncement";
import { VoteTallyBreakdown } from "./VoteTallyBreakdown";
import { BanishmentRevealCard } from "./BanishmentRevealCard";
import { VotingResultsActionFooter } from "./VotingResultsActionFooter";
import { useVotingResults } from "@/hooks/useVotingResults";
import { useGamePhaseGuard } from "@/hooks/useGamePhaseGuard";
import { MOCK_PLAYER_PROFILE } from "@/services/dashboard";
import { Radio, RotateCcw, Skull, Shield, Moon, Trophy } from "lucide-react";

interface VotingResultsContainerProps {
  roomCode?: string;
  roundNumber?: number;
}

export function VotingResultsContainer({
  roomCode = "A7K4D9",
  roundNumber = 2,
}: VotingResultsContainerProps) {
  useGamePhaseGuard(roomCode, "VOTING_RESULTS");
  const {
    state,
    revealAllegiance,
    hideAllegiance,
  } = useVotingResults(roomCode, roundNumber);

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

      {/* 3. Main Master 2-Column Layout */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 z-10 flex flex-col justify-between gap-4">
        <div className="flex flex-col gap-3">
          {/* Voting Results Header */}
          <VotingResultsHeader
            roundNumber={state.roundNumber}
            totalVotes={state.totalVotes}
            roomCode={state.roomCode}
          />

          {/* Architect Announcement Banner */}
          <VotingResultsAnnouncement
            banishedPlayer={state.banishedPlayer}
            isRoleRevealed={state.isRoleRevealed}
          />
        </div>

        {/* 2-Column Content Grid: Left (Vote Tallies & Council Status) | Right (Circle of Truth Banishment Reveal) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1 my-2">
          {/* LEFT COLUMN: Vote Tally Breakdown (5 cols on lg = ~42%) */}
          <div className="lg:col-span-5 flex flex-col">
            <VoteTallyBreakdown
              tallies={state.tallies}
              totalVotes={state.totalVotes}
              faithfulRemaining={state.faithfulRemaining}
              traitorsRemaining={state.traitorsRemaining}
            />
          </div>

          {/* RIGHT COLUMN: The Circle of Truth (7 cols on lg = ~58%) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <BanishmentRevealCard
              banishedPlayer={state.banishedPlayer}
              isRoleRevealed={state.isRoleRevealed}
              onReveal={revealAllegiance}
              onHide={hideAllegiance}
            />
          </div>
        </div>

        {/* Action Footer: Navigation to Night Phase or Victory */}
        <VotingResultsActionFooter
          roundNumber={state.roundNumber}
          gameOutcome={state.gameOutcome}
          isRoleRevealed={state.isRoleRevealed}
          roomCode={state.roomCode}
        />


      </main>
    </div>
  );
}

