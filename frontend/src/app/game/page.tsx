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
import { getApiBaseUrl } from "@/services/rooms";
import { getPlayerSession } from "@/services/playerSession";

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
  const isVictory =
    phase === "victory" ||
    phase === "endgame" ||
    searchParams.get("victory") !== null;

  const [serverPhase, setServerPhase] = useState<string | null>(null);

  useEffect(() => {
    if (room && !phase) {
      const apiUrl = getApiBaseUrl();
      const session = getPlayerSession();
      fetch(`${apiUrl}/api/v1/game/${room}/state?player_id=${session.id}&token=${encodeURIComponent(session.token || "")}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.phase) {
            setServerPhase(data.phase);
          }
        })
        .catch(() => {});
    }
  }, [room, phase]);

  if (isVictory || serverPhase === "GAME_OVER") {
    return <VictoryContainer roomCode={room || "A7K4D9"} />;
  }

  if (isVotingResults || serverPhase === "VOTING_RESULTS") {
    return <VotingResultsContainer roomCode={room || "A7K4D9"} roundNumber={round} />;
  }

  if (isVoting || serverPhase === "VOTING") {
    return <VotingContainer roomCode={room || "A7K4D9"} roundNumber={round} />;
  }

  if (isMorning || serverPhase === "MORNING") {
    return <MorningContainer roomCode={room || "A7K4D9"} roundNumber={round} />;
  }

  if (isNight || serverPhase === "NIGHT") {
    return <NightContainer roomCode={room || "A7K4D9"} roundNumber={round} />;
  }

  if (serverPhase === "LOBBY") {
    if (typeof window !== "undefined") {
      router.push(`/lobby?code=${room}`);
    }
    return <div className="min-h-screen bg-[#09060D]" />;
  }

  if (serverPhase === "ROLE_REVEAL") {
    if (typeof window !== "undefined") {
      router.push(`/game/reveal?code=${room}`);
    }
    return <div className="min-h-screen bg-[#09060D]" />;
  }

  if (room) {
    return <DiscussionContainer roomCode={room} roundNumber={round} />;
  }

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
