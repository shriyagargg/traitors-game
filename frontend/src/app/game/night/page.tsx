"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { NightContainer } from "@/components/night/NightContainer";
import { GameRole } from "@/types/roleReveal";

function NightPhaseContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("room") || searchParams.get("code") || "A7K4D9";
  const roleParam = searchParams.get("role") as GameRole | null;
  const initialRole: GameRole =
    roleParam === "traitor" ||
    roleParam === "doctor" ||
    roleParam === "detective" ||
    roleParam === "faithful"
      ? roleParam
      : "traitor";
  const roundNumber = Number(searchParams.get("round")) || 2;

  return (
    <NightContainer
      roomCode={roomCode}
      initialRole={initialRole}
      roundNumber={roundNumber}
    />
  );
}

export default function NightPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09060D] flex items-center justify-center text-gold-light font-cinzel">
          Entering Night Chamber...
        </div>
      }
    >
      <NightPhaseContent />
    </Suspense>
  );
}
