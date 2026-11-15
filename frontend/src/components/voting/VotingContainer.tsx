"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MorningPlayerList } from "../morning/MorningPlayerList";
import { VotingHeader } from "./VotingHeader";
import { VotingAnnouncement } from "./VotingAnnouncement";
import { VotingActionPanel } from "./VotingActionPanel";
import { useVotingPhase } from "@/hooks/useVotingPhase";
import { MOCK_PLAYER_PROFILE } from "@/services/dashboard";
import { INITIAL_VOTING_PLAYERS } from "@/services/votingService";
import { Radio, RotateCcw, FastForward, Scale, ArrowRight, Loader2 } from "lucide-react";

interface VotingContainerProps {
  roomCode?: string;
  roundNumber?: number;
}

export function VotingContainer({
  roomCode = "A7K4D9",
  roundNumber = 2,
}: VotingContainerProps) {
  const router = useRouter();
  const navigatedRef = useRef(false);
  const {
    state,
    targets,
    formattedTimer,
    selectTarget,
    submitVote,
    resetVote,
    resetTimer,
    fastForward,
  } = useVotingPhase(roomCode, roundNumber);

  const [isAdvancing, setIsAdvancing] = useState(false);

  const handleProceedToResults = () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    setIsAdvancing(true);
    setTimeout(() => {
      router.push(`/game/voting-results?room=${roomCode}&round=${roundNumber}`);
    }, 700);
  };

  // Auto-transition when vote is submitted or timer ends
  useEffect(() => {
    if ((state.allVotesRecorded || state.timerSeconds === 0) && !navigatedRef.current) {
      navigatedRef.current = true;
      setIsAdvancing(true);
      const timer = setTimeout(() => {
        router.push(`/game/voting-results?room=${roomCode}&round=${roundNumber}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.allVotesRecorded, state.timerSeconds]);

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
        {/* All Ballots Recorded / Advancing Banner */}
        {isAdvancing && (
          <div className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-gold-antique/20 via-purple-muted/30 to-gold-antique/20 border border-gold-antique/60 flex items-center justify-between text-xs sm:text-sm font-sans text-gold-light shadow-[0_0_20px_rgba(212,175,55,0.3)] animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-gold-antique" />
              <span className="font-semibold">All ballots recorded! Summoning the Council to the Circle of Truth...</span>
            </div>
            <span className="font-mono text-xs text-gold-antique">Tallying Votes...</span>
          </div>
        )}

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
                onProceedToResults={handleProceedToResults}
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

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleProceedToResults}
              disabled={isAdvancing}
              className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-gold-light to-gold-antique text-[#09060D] font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 transition-all"
            >
              <Scale className="w-3.5 h-3.5 text-[#09060D]" />
              <span>Proceed to Results</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#09060D]" />
            </button>

            <button
              onClick={fastForward}
              className="px-2.5 py-1 rounded-lg bg-[#1A0E1C] hover:bg-[#251528] border border-gold-antique/20 text-gold-light text-[10px] flex items-center gap-1 transition"
              title="Fast-forward vote submission and timer"
            >
              <FastForward className="w-3 h-3 text-gold-antique" />
              <span>Fast-Forward</span>
            </button>

            <button
              onClick={resetTimer}
              className="px-2 py-1 rounded bg-[#1A0E1C] hover:bg-[#251528] border border-gold-antique/20 text-gold-light text-[10px] flex items-center gap-1.5 transition"
              title="Reset countdown timer to 01:30"
            >
              <RotateCcw className="w-3 h-3 text-gold-antique" />
              <span>Reset (01:30)</span>
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
