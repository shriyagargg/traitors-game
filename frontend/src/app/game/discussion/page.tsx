"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DiscussionContainer } from "@/components/discussion/DiscussionContainer";

function DiscussionContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("room") || searchParams.get("code") || "";
  const roundNumber = Number(searchParams.get("round")) || 1;

  return roomCode ? <DiscussionContainer roomCode={roomCode} roundNumber={roundNumber} /> : <div className="min-h-screen bg-[#09060D]" />;
}

export default function DiscussionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09060D] flex items-center justify-center text-gold-light font-cinzel">
          Entering Council Discussion...
        </div>
      }
    >
      <DiscussionContent />
    </Suspense>
  );
}
