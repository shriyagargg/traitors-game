"use client";

import React, { Suspense } from "react";
import RoleRevealPage from "@/app/game/reveal/page";

export default function LobbyRevealAliasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09060D]" />}>
      <RoleRevealPage />
    </Suspense>
  );
}
