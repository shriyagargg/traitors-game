"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MorningContainer } from "@/components/morning/MorningContainer";

function MorningContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("room") || searchParams.get("code") || "";
  const roundNumber = Number(searchParams.get("round")) || 1;

  return <MorningContainer roomCode={roomCode} roundNumber={roundNumber} />;
}

export default function MorningPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09060D] flex items-center justify-center text-gold-light font-cinzel">
          The Sun Rises Over the Chamber...
        </div>
      }
    >
      <MorningContent />
    </Suspense>
  );
}
