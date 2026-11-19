"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DiscussionPlayerList } from "./DiscussionPlayerList";
import { DiscussionChatArea } from "./DiscussionChatArea";
import { DiscussionArchitectPanel } from "./DiscussionArchitectPanel";
import { useDiscussion } from "@/hooks/useDiscussion";
import { useGamePhaseGuard } from "@/hooks/useGamePhaseGuard";
import { getPlayerSession } from "@/services/playerSession";
import { getApiBaseUrl } from "@/services/rooms";
import { Radio, RotateCcw, Vote, ArrowRight, FastForward, Loader2 } from "lucide-react";

interface DiscussionContainerProps {
  roomCode?: string;
  roundNumber?: number;
}

export function DiscussionContainer({
  roomCode = "",
  roundNumber = 1,
}: DiscussionContainerProps) {
  useGamePhaseGuard(roomCode, "DISCUSSION");
  const router = useRouter();
  const navigatedRef = useRef(false); // one-shot guard — prevents double-fire
  const {
    state,
    formattedTimer,
    sendMessage,
    consultArchitect,
  } = useDiscussion(roomCode, roundNumber);

  const [isAdvancing, setIsAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState("");

  const handleProceedToVoting = async () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    setIsAdvancing(true);
    try {
      const session = getPlayerSession(roomCode);
      const response = await fetch(`${getApiBaseUrl()}/api/v1/game/${encodeURIComponent(roomCode)}/advance-phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: session.id,
          token: session.token,
          account_token: session.accountToken,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.phase !== "VOTING") {
        navigatedRef.current = false;
        setIsAdvancing(false);
        setAdvanceError(result.detail || result.message || "The server has not opened voting yet.");
        return;
      }
    } catch {
      navigatedRef.current = false;
      setIsAdvancing(false);
      setAdvanceError("Could not reach the game server to open voting.");
      return;
    }
    router.push(`/game/voting?room=${roomCode}&round=${roundNumber}`);
  };

  // Route only after the server announces a phase transition. The local clock
  // is a display; it never advances game state or sends players ahead early.
  useEffect(() => {
    if (state.serverPhase === "VOTING" && !navigatedRef.current) {
      navigatedRef.current = true;
      setIsAdvancing(true);
      router.push(`/game/voting?room=${roomCode}&round=${roundNumber}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.serverPhase]);

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
      <DashboardHeader activeNav="dashboard" profile={{ name: getPlayerSession().name, email: getPlayerSession().email || "", avatarUrl: getPlayerSession().avatarUrl, roleBadge: "" }} />

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
        {advanceError && <p role="alert" className="text-right text-xs text-red-300">{advanceError}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1">
          {/* LEFT COLUMN: Player List (3 cols on lg) */}
          <div className="lg:col-span-3 flex flex-col">
            <DiscussionPlayerList
              players={state.players}
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
              onProceedToVoting={handleProceedToVoting}
            />
          </div>

          {/* RIGHT COLUMN: The Architect Panel (3 cols on lg) */}
          <div className="lg:col-span-3 flex flex-col">
            <DiscussionArchitectPanel
              roundNumber={state.roundNumber}
              phaseName={state.phaseName}
              phaseType={state.phaseType}
              onConsult={consultArchitect}
            />
          </div>
        </div>


      </main>
    </div>
  );
}
