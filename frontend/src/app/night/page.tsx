"use client";

import React, { Suspense } from "react";
import NightPage from "@/app/game/night/page";

export default function NightAliasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09060D]" />}>
      <NightPage />
    </Suspense>
  );
}
