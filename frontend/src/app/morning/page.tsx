"use client";

import React, { Suspense } from "react";
import MorningPage from "@/app/game/morning/page";

export default function MorningAliasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09060D]" />}>
      <MorningPage />
    </Suspense>
  );
}
