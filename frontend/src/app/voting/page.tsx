"use client";

import React, { Suspense } from "react";
import VotingPage from "@/app/game/voting/page";

export default function VotingAliasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09060D]" />}>
      <VotingPage />
    </Suspense>
  );
}
