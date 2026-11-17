"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DiscussionPlayerList } from "../discussion/DiscussionPlayerList";
import { NightHeader } from "./NightHeader";
import { NightAnnouncement } from "./NightAnnouncement";
import { RoleActionPanel } from "./RoleActionPanel";
import { useNightPhase } from "@/hooks/useNightPhase";
import { useGamePhaseGuard } from "@/hooks/useGamePhaseGuard";
import { GameRole } from "@/types/roleReveal";
import { MOCK_PLAYER_PROFILE } from "@/services/dashboard";
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
  useGamePhaseGuard(roomCode, "NIGHT");
  const router = useRouter();
  const navigatedRef = useRef(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const {
    state,
    config,
    targets,
    formattedTimer,
    selectTarget,
    submitAction,
  } = useNightPhase(roomCode, initialRole, roundNumber);

  // Auto-advance to Morning when timer hits 0 or all actions resolved
  useEffect(() => {
    if ((state.timerSeconds === 0 || state.allActionsResolved) && !navigatedRef.current) {
      navigatedRef.current = true;
      setIsAdvancing(true);
      const t = setTimeout(() => {
        router.push(`/game/morning?room=${roomCode}&round=${roundNumber}`);
      }, 1500);
  return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.timerSeconds, state.allActionsResolved]);

  const livePlayers = targets.map((t) => ({
        id: t.id,
        name: t.name,
        avatarUrl: t.avatarUrl,
        isAlive: t.isAlive,
        isHost: false,
        isCurrentUser: t.id === state.currentUserId,
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
            <DiscussionPlayerList players={livePlayers} />
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
                investigationResult={state.investigationResult}
                onSelectTarget={selectTarget}
                onSubmitAction={submitAction}
              />
            </div>
          </div>
        </div>


      </main>
    </div>
  );
}
