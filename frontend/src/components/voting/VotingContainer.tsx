"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MorningPlayerList } from "../morning/MorningPlayerList";
import { VotingHeader } from "./VotingHeader";
import { VotingAnnouncement } from "./VotingAnnouncement";
import { VotingActionPanel } from "./VotingActionPanel";
import { useVotingPhase } from "@/hooks/useVotingPhase";
import { useGamePhaseGuard } from "@/hooks/useGamePhaseGuard";
import { getPlayerSession } from "@/services/playerSession";
import { Radio, RotateCcw, FastForward, Scale, ArrowRight, Loader2 } from "lucide-react";

interface VotingContainerProps {
  roomCode?: string;
  roundNumber?: number;
}

export function VotingContainer({
  roomCode = "",
  roundNumber = 1,
}: VotingContainerProps) {
  useGamePhaseGuard(roomCode, "VOTING");
  const router = useRouter();
  const navigatedRef = useRef(false);
  const {
    state,
    targets,
    allPlayers,
    formattedTimer,
    selectTarget,
    submitVote,
    resetVote,
  } = useVotingPhase(roomCode, roundNumber);

  const [isAdvancing, setIsAdvancing] = useState(false);

  // Results navigation follows the server's phase event, never a client timer
  // or an unconfirmed vote count.
  useEffect(() => {
    if ((state.serverPhase === "VOTING_RESULTS" || state.serverPhase === "GAME_OVER") && !navigatedRef.current) {
      navigatedRef.current = true;
      setIsAdvancing(true);
      router.push(`/game/voting-results?room=${roomCode}&round=${roundNumber}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.serverPhase]);

  const playerRoster = allPlayers && allPlayers.length > 0
    ? allPlayers
    : targets;

  // Map all council members to MorningPlayer shape for player list
  const playerList = playerRoster.map((p: any) => ({
    id: p.id,
    name: p.name,
    avatarUrl: p.avatarUrl || "",
    isAlive: p.isAlive ?? true,
    isHost: p.isHost ?? false,
    isCurrentUser: p.id === state.currentUserId,
    isEliminatedTonight: !(p.isAlive ?? true),
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
      <DashboardHeader activeNav="dashboard" profile={{ name: getPlayerSession().name, email: getPlayerSession().email || "", avatarUrl: getPlayerSession().avatarUrl, roleBadge: "" }} />

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
              />

              {/* Exactly One Architect Announcement Banner */}
              <VotingAnnouncement />
            </div>

            {/* Voting Action Panel with Eligible Living Targets & Submit Button */}
            <div className="flex-1 flex flex-col justify-center">
              <p className="mb-2 text-right text-xs font-mono text-text-secondary" aria-live="polite">
                Ballots received: {state.votesCast ?? 0} / {state.eligibleVoters ?? allPlayers.filter((p: any) => p.isAlive).length}
              </p>
              <VotingActionPanel
                targets={targets}
                selectedTargetId={state.selectedTargetId}
                isSubmitted={state.isSubmitted}
                isVotingOpen={state.hasSynced && !state.isTimeUp}
                submittedTargetName={state.submittedTargetName}
                onSelectTarget={selectTarget}
                onSubmitVote={submitVote}
                roomCode={roomCode}
                roundNumber={roundNumber}
              />
            </div>
          </div>
        </div>


      </main>
    </div>
  );
}
