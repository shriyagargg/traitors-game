"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { VictoryContainer } from "@/components/victory/VictoryContainer";
import { VictoryOutcome } from "@/types/victory";

function VictoryAliasContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("room") || "";
  const outcomeParam = searchParams.get("outcome");
  const initialOutcome: VictoryOutcome =
    outcomeParam === "TRAITOR_VICTORY" ? "TRAITOR_VICTORY" : "FAITHFUL_VICTORY";

  return <VictoryContainer roomCode={roomCode} initialOutcome={initialOutcome} />;
}

export default function VictoryAliasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09060D] flex items-center justify-center text-gold-light font-cinzel">
          Loading Victory Chronicles...
        </div>
      }
    >
      <VictoryAliasContent />
    </Suspense>
  );
}

