"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { VotingContainer } from "@/components/voting/VotingContainer";

function VotingPageContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("room") || searchParams.get("code") || "";
  const roundNumber = Number(searchParams.get("round")) || 1;

  return <VotingContainer roomCode={roomCode} roundNumber={roundNumber} />;
}

export default function VotingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09060D] flex items-center justify-center text-gold-light font-cinzel">
          Convening Council Ballots...
        </div>
      }
    >
      <VotingPageContent />
    </Suspense>
  );
}
