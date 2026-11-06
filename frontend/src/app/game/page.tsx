"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GameHubContainer } from "@/components/game/GameHubContainer";
import { DiscussionContainer } from "@/components/discussion/DiscussionContainer";

function GamePageContent() {
  const searchParams = useSearchParams();
  const room = searchParams.get("room") || searchParams.get("play");

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
