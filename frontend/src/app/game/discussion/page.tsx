"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { DiscussionContainer } from "@/components/discussion/DiscussionContainer";

function DiscussionContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("room") || searchParams.get("code") || "";
  const roundNumber = Number(searchParams.get("round")) || 1;

  return roomCode ? (
    <DiscussionContainer roomCode={roomCode} roundNumber={roundNumber} />
  ) : (
    <main className="min-h-screen bg-[#09060D] flex items-center justify-center px-6 text-center text-[#F5EEDC]">
      <div>
        <h1 className="font-cinzel text-2xl">Room not found in this link</h1>
        <p className="mt-3 text-sm text-white/65">Open your lobby and re-enter the game to continue.</p>
        <Link href="/lobby" className="mt-6 inline-block rounded-xl bg-[#D4AF37] px-5 py-3 font-semibold text-[#09060D]">Return to lobby</Link>
      </div>
    </main>
  );
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
