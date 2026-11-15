"use client";

import React from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { VotingResultsHeader } from "./VotingResultsHeader";
import { VotingResultsAnnouncement } from "./VotingResultsAnnouncement";
import { VoteTallyBreakdown } from "./VoteTallyBreakdown";
import { BanishmentRevealCard } from "./BanishmentRevealCard";
import { VotingResultsActionFooter } from "./VotingResultsActionFooter";
import { useVotingResults } from "@/hooks/useVotingResults";
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
  const {
    state,
    revealAllegiance,
    hideAllegiance,
    setRoleDemo,
    setOutcomeDemo,
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

        {/* 4. Evaluator & Demonstration Toolbar */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gold-antique/10 text-[11px] font-sans text-text-secondary/70">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-gold-antique animate-pulse" />
            <span className="font-mono text-gold-light uppercase tracking-wider">
              Mode: {state.connectionStatus}
            </span>
            <span className="text-white/20">|</span>
            <span>Page 11: Council Banishment &amp; Voting Results</span>
          </div>

          {/* Demo Controls for Testing Allegiance & Outcomes */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-mono text-text-secondary/50">
              Demo Test:
            </span>

            {/* Test Traitor vs Faithful */}
            <button
              type="button"
              onClick={() => setRoleDemo("Traitor")}
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono flex items-center gap-1 transition-all ${
                state.banishedPlayer.isTraitor
                  ? "bg-red-950/60 border-red-500/50 text-red-300"
                  : "bg-black/40 border-white/10 hover:border-white/20 text-text-secondary"
              }`}
            >
              <Skull className="w-3 h-3" />
              <span>Traitor Role</span>
            </button>

            <button
              type="button"
              onClick={() => setRoleDemo("Faithful")}
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono flex items-center gap-1 transition-all ${
                !state.banishedPlayer.isTraitor
                  ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                  : "bg-black/40 border-white/10 hover:border-white/20 text-text-secondary"
              }`}
            >
              <Shield className="w-3 h-3" />
              <span>Faithful Role</span>
            </button>

            {/* Test Outcome: Continue vs Victory */}
            <button
              type="button"
              onClick={() =>
                setOutcomeDemo(
                  state.gameOutcome === "CONTINUE_TO_NIGHT"
                    ? "FAITHFUL_VICTORY"
                    : "CONTINUE_TO_NIGHT"
                )
              }
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono flex items-center gap-1 transition-all ${
                state.gameOutcome !== "CONTINUE_TO_NIGHT"
                  ? "bg-gold-antique/20 border-gold-antique/60 text-gold-light"
                  : "bg-black/40 border-white/10 hover:border-white/20 text-text-secondary"
              }`}
            >
              {state.gameOutcome === "CONTINUE_TO_NIGHT" ? (
                <>
                  <Moon className="w-3 h-3" />
                  <span>Target: Night</span>
                </>
              ) : (
                <>
                  <Trophy className="w-3 h-3 text-gold-light" />
                  <span>Target: Victory</span>
                </>
              )}
            </button>

            {/* Reset Reveal */}
            <button
              type="button"
              onClick={() => {
                if (state.isRoleRevealed) hideAllegiance();
                else revealAllegiance();
              }}
              className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 hover:border-white/20 text-[10px] font-mono text-text-secondary hover:text-gold-light flex items-center gap-1 transition-all"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{state.isRoleRevealed ? "Reset Reveal" : "Force Reveal"}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

