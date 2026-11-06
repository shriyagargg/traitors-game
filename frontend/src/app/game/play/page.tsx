"use client";

import React, { Suspense } from "react";
import DiscussionPage from "../discussion/page";

export default function GamePlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09060D]" />}>
      <DiscussionPage />
    </Suspense>
  );
}
