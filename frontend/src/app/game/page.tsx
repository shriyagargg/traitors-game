"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { GameHubContainer } from "@/components/game/GameHubContainer";
import { DiscussionContainer } from "@/components/discussion/DiscussionContainer";
import { NightContainer } from "@/components/night/NightContainer";
import { MorningContainer } from "@/components/morning/MorningContainer";
import { VotingContainer } from "@/components/voting/VotingContainer";
import { VotingResultsContainer } from "@/components/voting-results/VotingResultsContainer";
import { VictoryContainer } from "@/components/victory/VictoryContainer";
import { RoleRevealContainer } from "@/components/reveal/RoleRevealContainer";
import { getApiBaseUrl } from "@/services/rooms";
import { getPlayerSession, ensureRoomSession } from "@/services/playerSession";

function GamePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const room = searchParams.get("room") || searchParams.get("play");
  const phase = searchParams.get("phase");
  const round = Number(searchParams.get("round")) || 1;

  const isNight = phase === "night" || searchParams.get("night") !== null;
  const isMorning = phase === "morning" || searchParams.get("morning") !== null;
  const isVoting = phase === "voting" || searchParams.get("voting") !== null;
  const isVotingResults =
    phase === "voting-results" ||
    phase === "results" ||
    searchParams.get("voting-results") !== null ||
    searchParams.get("results") !== null;
  const isVictory = phase === "victory" || phase === "endgame" || searchParams.get("victory") !== null;

  const [serverPhase, setServerPhase] = useState<string | null>(null);
  const [phaseChecked, setPhaseChecked] = useState(false);

  useEffect(() => {
    let alive = true;
    if (room) {
      const apiUrl = getApiBaseUrl();
      (async () => {
        let session = getPlayerSession(room);
        if (!session.token && session.accountToken) {
          session = await ensureRoomSession(room);
        }
        if (!alive) return;
        try {
          const r = await fetch(
            `${apiUrl}/api/v1/game/${room}/state?player_id=${session.id}&token=${encodeURIComponent(session.token || "")}&account_token=${encodeURIComponent(session.accountToken || "")}`
          );
          if (r.ok) {
            const data = await r.json();
            if (alive && data.phase) {
              setServerPhase(data.phase);
            }
          }
        } catch {}
        if (alive) setPhaseChecked(true);
      })();
    } else {
      setPhaseChecked(true);
    }
    return () => { alive = false; };
  }, [room, phase]);

  if (room && serverPhase === "GAME_OVER") {
    return <VictoryContainer roomCode={room} />;
  }

  if (room && serverPhase === "VOTING_RESULTS") {
    return <VotingResultsContainer roomCode={room || ""} roundNumber={round} />;
  }

  if (room && serverPhase === "VOTING") {
    return <VotingContainer roomCode={room || ""} roundNumber={round} />;
  }

  if (room && serverPhase === "MORNING") {
    return <MorningContainer roomCode={room || ""} roundNumber={round} />;
  }

  if (room && serverPhase === "NIGHT") {
    return <NightContainer roomCode={room || ""} roundNumber={round} />;
  }

  if (serverPhase === "LOBBY") {
    if (typeof window !== "undefined") {
      router.push(`/lobby?code=${room}`);
    }
    return <div className="min-h-screen bg-[#09060D]" />;
  }

  if (serverPhase === "ROLE_REVEAL") {
    return <RoleRevealContainer initialRoomCode={room || ""} />;
  }

  if (room && serverPhase === "DISCUSSION") {
    return <DiscussionContainer roomCode={room} roundNumber={round} />;
  }

  if (room && !phaseChecked) return <div className="min-h-screen bg-[#09060D]" />;

  return <GameHubContainer initialTab="create" />;
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09060D] flex items-center justify-center text-gold-light font-cinzel">
          Loading AI Traitors...
        </div>
      }
    >
      <GamePageContent />
    </Suspense>
  );
}
