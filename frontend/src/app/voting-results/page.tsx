"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { VotingResultsContainer } from "@/components/voting-results/VotingResultsContainer";

function VotingResultsAliasContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("room") || "A7K4D9";
  const roundNumber = parseInt(searchParams.get("round") || "2", 10);

  return <VotingResultsContainer roomCode={roomCode} roundNumber={roundNumber} />;
}

export default function VotingResultsAliasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09060D] flex items-center justify-center text-gold-light font-cinzel">
          Loading Banishment Ceremony...
        </div>
      }
    >
      <VotingResultsAliasContent />
    </Suspense>
  );
}

