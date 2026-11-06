"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GameHubContainer } from "@/components/game/GameHubContainer";
import { DiscussionContainer } from "@/components/discussion/DiscussionContainer";
import { NightContainer } from "@/components/night/NightContainer";
import { MorningContainer } from "@/components/morning/MorningContainer";

function GamePageContent() {
  const searchParams = useSearchParams();
  const room = searchParams.get("room") || searchParams.get("play");
  const phase = searchParams.get("phase");
  const isNight = phase === "night" || searchParams.get("night") !== null;
  const isMorning = phase === "morning" || searchParams.get("morning") !== null;

  if (isMorning) {
    return <MorningContainer roomCode={room || "A7K4D9"} roundNumber={2} />;
  }

  if (isNight) {
    return <NightContainer roomCode={room || "A7K4D9"} roundNumber={2} />;
  }

  if (room) {
    return <DiscussionContainer roomCode={room} roundNumber={2} />;
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
