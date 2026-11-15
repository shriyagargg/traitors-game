"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DiscussionPlayerList } from "../discussion/DiscussionPlayerList";
import { NightHeader } from "./NightHeader";
import { NightAnnouncement } from "./NightAnnouncement";
import { RoleActionPanel } from "./RoleActionPanel";
import { useNightPhase } from "@/hooks/useNightPhase";
import { GameRole } from "@/types/roleReveal";
import { MOCK_PLAYER_PROFILE } from "@/services/dashboard";
import { INITIAL_DISCUSSION_PLAYERS } from "@/services/discussionService";
import { Radio, RotateCcw, FastForward, Moon, Loader2 } from "lucide-react";

interface NightContainerProps {
  roomCode?: string;
  initialRole?: GameRole;
  roundNumber?: number;
}

export function NightContainer({
  roomCode = "A7K4D9",
  initialRole = "traitor",
  roundNumber = 2,
}: NightContainerProps) {
  const router = useRouter();
  const [isAdvancing, setIsAdvancing] = useState(false);

  const {
    state,
    config,
    targets,
    formattedTimer,
    selectTarget,
    submitAction,
    switchRole,
    resetAction,
    resetTimer,
    fastForward,
  } = useNightPhase(roomCode, initialRole, roundNumber);

  // Auto-advance to Morning when timer hits 0 or all actions resolved
  useEffect(() => {
    if ((state.timerSeconds === 0 || state.allActionsResolved) && !isAdvancing) {
      setIsAdvancing(true);
      const t = setTimeout(() => {
        router.push(`/game/morning?room=${state.roomCode}&round=${state.roundNumber}`);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [state.timerSeconds, state.allActionsResolved, isAdvancing, router, state.roomCode, state.roundNumber]);

  const handleProceedToMorning = () => {
    setIsAdvancing(true);
    setTimeout(() => {
      router.push(`/game/morning?room=${state.roomCode}&round=${state.roundNumber}`);
    }, 700);
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

      {/* Advancing overlay banner */}
      {isAdvancing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Moon className="w-10 h-10 text-purple-muted animate-pulse" />
            <Loader2 className="w-8 h-8 text-gold-antique animate-spin" />
            <p className="text-gold-light font-serif text-lg tracking-widest uppercase">
              The night ends… dawn approaches
            </p>
          </div>
        </div>
      )}

      {/* 2. Top Navigation Bar (Reused Master Header) */}
      <DashboardHeader activeNav="dashboard" profile={MOCK_PLAYER_PROFILE} />

      {/* 3. Main Master 2-Column Layout */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 z-10 flex flex-col justify-between gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1">
          {/* LEFT COLUMN: Player List (3 cols on lg = ~25% width) */}
          <div className="lg:col-span-3 flex flex-col">
            <DiscussionPlayerList players={INITIAL_DISCUSSION_PLAYERS} />
          </div>

          {/* RIGHT COLUMN: Night Phase & Role Action Panel (9 cols on lg = ~75% width) */}
          <div className="lg:col-span-9 flex flex-col justify-between gap-3">
            <div>
              {/* Night Phase Header with Moon and Countdown Timer */}
              <NightHeader
                roundNumber={state.roundNumber}
                formattedTimer={formattedTimer}
              />

              {/* Exactly One Architect Announcement Banner */}
              <NightAnnouncement announcementText={config.announcementText} />
            </div>

            {/* Dynamic Role-Specific Action Panel */}
            <div className="flex-1 flex flex-col justify-center">
              <RoleActionPanel
                config={config}
                targets={targets}
                selectedTargetId={state.selectedTargetId}
                isSubmitted={state.isSubmitted}
                submittedTargetName={state.submittedTargetName}
                onSelectTarget={selectTarget}
                onSubmitAction={submitAction}
              />
            </div>
          </div>
        </div>

        {/* 4. Evaluator & Demonstration Toolbar */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gold-antique/10 text-[11px] font-sans text-text-secondary/70">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-gold-antique animate-pulse" />
            <span className="text-gold-light/80">Night Action Channel:</span>
            <span className="bg-[#1A0E1C] px-2 py-0.5 rounded border border-gold-antique/25 font-mono text-[10px] text-text-main">
              {state.connectionStatus === "connected"
                ? "Live WebSocket"
                : "Mock Evaluation Adapter"}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-text-secondary/50">Preview Role:</span>
            <button
              onClick={() => switchRole("traitor")}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition border ${
                state.currentRole === "traitor"
                  ? "bg-red-950/80 border-red-500 text-red-300 shadow-[0_0_8px_rgba(220,38,38,0.4)]"
                  : "bg-[#1A0E1C] border-white/10 text-text-secondary hover:text-red-400"
              }`}
            >
              Traitor
            </button>
            <button
              onClick={() => switchRole("doctor")}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition border ${
                state.currentRole === "doctor"
                  ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                  : "bg-[#1A0E1C] border-white/10 text-text-secondary hover:text-emerald-400"
              }`}
            >
              Doctor
            </button>
            <button
              onClick={() => switchRole("detective")}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition border ${
                state.currentRole === "detective"
                  ? "bg-amber-950/80 border-gold-antique text-gold-light shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                  : "bg-[#1A0E1C] border-white/10 text-text-secondary hover:text-gold-light"
              }`}
            >
              Detective
            </button>
            <button
              onClick={() => switchRole("faithful")}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition border ${
                state.currentRole === "faithful"
                  ? "bg-blue-950/80 border-blue-500 text-blue-300 shadow-[0_0_8px_rgba(96,165,250,0.4)]"
                  : "bg-[#1A0E1C] border-white/10 text-text-secondary hover:text-blue-400"
              }`}
            >
              Faithful
            </button>

            <span className="text-white/20 mx-1">|</span>

            <button
              onClick={resetTimer}
              className="px-2 py-1 rounded bg-[#1A0E1C] hover:bg-[#251528] border border-gold-antique/20 text-gold-light text-[10px] flex items-center gap-1 transition"
              title="Reset countdown timer to 00:30"
            >
              <RotateCcw className="w-3 h-3 text-gold-antique" />
              <span>Reset Timer (00:30)</span>
            </button>
            <button
              onClick={resetAction}
              className="px-2 py-1 rounded bg-[#1A0E1C] hover:bg-[#251528] border border-gold-antique/20 text-gold-light text-[10px] transition"
              title="Reset submitted action"
            >
              Reset Action
            </button>

            <span className="text-white/20 mx-1">|</span>

            <button
              onClick={() => { fastForward(); }}
              className="px-2.5 py-1 rounded bg-purple-muted/30 hover:bg-purple-muted/50 border border-purple-muted/60 text-[#C7BAC8] text-[10px] flex items-center gap-1 transition"
              title="Fast-forward night to 00:00"
            >
              <FastForward className="w-3 h-3" />
              Fast-Forward
            </button>
            <button
              onClick={handleProceedToMorning}
              className="px-2.5 py-1 rounded bg-gold-antique/20 hover:bg-gold-antique/30 border border-gold-antique/50 text-gold-light text-[10px] flex items-center gap-1 transition font-semibold"
              title="Skip to Morning Announcement"
            >
              <Moon className="w-3 h-3" />
              Proceed to Morning
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
