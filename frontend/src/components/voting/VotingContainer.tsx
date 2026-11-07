"use client";

import React from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MorningPlayerList } from "../morning/MorningPlayerList";
import { VotingHeader } from "./VotingHeader";
import { VotingAnnouncement } from "./VotingAnnouncement";
import { VotingActionPanel } from "./VotingActionPanel";
import { useVotingPhase } from "@/hooks/useVotingPhase";
import { MOCK_PLAYER_PROFILE } from "@/services/dashboard";
import { INITIAL_VOTING_PLAYERS } from "@/services/votingService";
import { Radio, RotateCcw } from "lucide-react";

interface VotingContainerProps {
  roomCode?: string;
  roundNumber?: number;
}

export function VotingContainer({
  roomCode = "A7K4D9",
  roundNumber = 2,
}: VotingContainerProps) {
  const {
    state,
    targets,
    formattedTimer,
    selectTarget,
    submitVote,
    resetVote,
    resetTimer,
  } = useVotingPhase(roomCode, roundNumber);

  // Map INITIAL_VOTING_PLAYERS to MorningPlayer shape for player list
  const playerList = INITIAL_VOTING_PLAYERS.map((p) => ({
    ...p,
    isEliminatedTonight: !p.isAlive,
  }));

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
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 z-10 flex flex-col justify-between gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1">
          {/* LEFT COLUMN: Player List (3 cols on lg = ~25% width) */}
          <div className="lg:col-span-3 flex flex-col">
            <MorningPlayerList players={playerList} />
          </div>

          {/* RIGHT COLUMN: Voting Phase Header, Announcement & Voting Action Panel (9 cols on lg = ~75% width) */}
          <div className="lg:col-span-9 flex flex-col justify-between gap-3">
            <div>
              {/* Voting Phase Header with Ballot Box and Countdown Timer */}
              <VotingHeader
                roundNumber={state.roundNumber}
                formattedTimer={formattedTimer}
              />

              {/* Exactly One Architect Announcement Banner */}
              <VotingAnnouncement />
            </div>

            {/* Voting Action Panel with Eligible Living Targets & Submit Button */}
            <div className="flex-1 flex flex-col justify-center">
              <VotingActionPanel
                targets={targets}
                selectedTargetId={state.selectedTargetId}
                isSubmitted={state.isSubmitted}
                submittedTargetName={state.submittedTargetName}
                onSelectTarget={selectTarget}
                onSubmitVote={submitVote}
              />
            </div>
          </div>
        </div>

        {/* 4. Evaluator & Demonstration Toolbar */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gold-antique/10 text-[11px] font-sans text-text-secondary/70">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-gold-antique animate-pulse" />
            <span className="text-gold-light/80">Voting Protocol:</span>
            <span className="bg-[#1A0E1C] px-2 py-0.5 rounded border border-gold-antique/25 font-mono text-[10px] text-text-main">
              {state.connectionStatus === "connected"
                ? "Live WebSocket"
                : "Mock Evaluation Adapter"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-text-secondary/50">Evaluation Tools:</span>
            <button
              onClick={resetTimer}
              className="px-2 py-1 rounded bg-[#1A0E1C] hover:bg-[#251528] border border-gold-antique/20 text-gold-light text-[10px] flex items-center gap-1.5 transition"
              title="Reset countdown timer to 01:30"
            >
              <RotateCcw className="w-3 h-3 text-gold-antique" />
              <span>Reset Timer (01:30)</span>
            </button>
            <button
              onClick={resetVote}
              className="px-2 py-1 rounded bg-[#1A0E1C] hover:bg-[#251528] border border-gold-antique/20 text-gold-light text-[10px] transition"
              title="Reset submitted vote"
            >
              Reset Vote
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
