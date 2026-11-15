"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DiscussionPlayerList } from "./DiscussionPlayerList";
import { DiscussionChatArea } from "./DiscussionChatArea";
import { DiscussionArchitectPanel } from "./DiscussionArchitectPanel";
import { useDiscussion } from "@/hooks/useDiscussion";
import { MOCK_PLAYER_PROFILE } from "@/services/dashboard";
import { Radio, RotateCcw, Vote, ArrowRight, FastForward, Loader2 } from "lucide-react";

interface DiscussionContainerProps {
  roomCode?: string;
  roundNumber?: number;
}

export function DiscussionContainer({
  roomCode = "A7K4D9",
  roundNumber = 2,
}: DiscussionContainerProps) {
  const router = useRouter();
  const {
    state,
    formattedTimer,
    sendMessage,
    togglePlayerStatus,
    resetTimer,
    fastForward,
  } = useDiscussion(roomCode, roundNumber);

  const [isAdvancing, setIsAdvancing] = useState(false);

  const handleProceedToVoting = () => {
    if (isAdvancing) return;
    setIsAdvancing(true);
    setTimeout(() => {
      router.push(`/game/voting?room=${state.roomCode}&round=${state.roundNumber}`);
    }, 700);
  };

  // Auto-transition when countdown finishes
  useEffect(() => {
    if (state.timerSeconds === 0 && !isAdvancing) {
      setIsAdvancing(true);
      const timer = setTimeout(() => {
        router.push(`/game/voting?room=${state.roomCode}&round=${state.roundNumber}`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.timerSeconds, isAdvancing, router, state.roomCode, state.roundNumber]);

  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col selection:bg-purple-muted selection:text-gold-light relative overflow-x-hidden">
      {/* 1. Cinematic Background Vignette & Glow Layers */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-70"
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

      {/* 3. Main Master 3-Column Layout */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 z-10 flex flex-col justify-between gap-4">
        {/* Time's Up / Advancing Banner */}
        {isAdvancing && (
          <div className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-gold-antique/20 via-purple-muted/30 to-gold-antique/20 border border-gold-antique/60 flex items-center justify-between text-xs sm:text-sm font-sans text-gold-light shadow-[0_0_20px_rgba(212,175,55,0.3)] animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-gold-antique" />
              <span className="font-semibold">Discussion period concluded. Convening the Council for Voting...</span>
            </div>
            <span className="font-mono text-xs text-gold-antique">Loading Ballot Box...</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1">
          {/* LEFT COLUMN: Player List (3 cols on lg) */}
          <div className="lg:col-span-3 flex flex-col">
            <DiscussionPlayerList
              players={state.players}
              onTogglePlayerStatus={togglePlayerStatus}
            />
          </div>

          {/* CENTRE COLUMN: Discussion Area (6 cols on lg) */}
          <div className="lg:col-span-6 flex flex-col">
            <DiscussionChatArea
              roundNumber={state.roundNumber}
              phaseType={state.phaseType}
              formattedTimer={formattedTimer}
              announcement={state.announcement}
              messages={state.messages}
              onSendMessage={sendMessage}
              onProceedToVote={handleProceedToVoting}
            />
          </div>

          {/* RIGHT COLUMN: The Architect Panel (3 cols on lg) */}
          <div className="lg:col-span-3 flex flex-col">
            <DiscussionArchitectPanel
              roundNumber={state.roundNumber}
              phaseName={state.phaseName}
              phaseType={state.phaseType}
            />
          </div>
        </div>

        {/* 4. Evaluator & Demonstration Toolbar */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gold-antique/10 text-[11px] font-sans text-text-secondary/70">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-gold-antique animate-pulse" />
            <span className="text-gold-light/80">Gameplay Channel:</span>
            <span className="bg-[#1A0E1C] px-2 py-0.5 rounded border border-gold-antique/25 font-mono text-[10px] text-text-main">
              {state.connectionStatus === "connected"
                ? "Live WebSocket"
                : "Mock Evaluation Adapter"}
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleProceedToVoting}
              disabled={isAdvancing}
              className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-gold-light to-gold-antique text-[#09060D] font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 transition-all"
            >
              <Vote className="w-3.5 h-3.5 text-[#09060D]" />
              <span>Proceed to Voting</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#09060D]" />
            </button>

            <button
              onClick={fastForward}
              className="px-2.5 py-1 rounded-lg bg-[#1A0E1C] hover:bg-[#251528] border border-gold-antique/20 text-gold-light text-[10px] flex items-center gap-1 transition"
              title="Fast-forward timer to 0:00"
            >
              <FastForward className="w-3 h-3 text-gold-antique" />
              <span>Fast-Forward</span>
            </button>

            <button
              onClick={resetTimer}
              className="px-2 py-1 rounded bg-[#1A0E1C] hover:bg-[#251528] border border-gold-antique/20 text-gold-light text-[10px] flex items-center gap-1.5 transition"
              title="Reset countdown timer to 02:48"
            >
              <RotateCcw className="w-3 h-3 text-gold-antique" />
              <span>Reset (02:48)</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
