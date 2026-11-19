"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthCard, AuthMode } from "./AuthCard";

interface AuthPageContainerProps {
  defaultMode?: AuthMode;
}

export function AuthPageContainer({ defaultMode = "login" }: AuthPageContainerProps) {
  const [, setCurrentMode] = useState<AuthMode>(defaultMode);

  return (
    <main className="relative min-h-screen w-full flex flex-col bg-[#100d13] text-[#f5f1f7]">


      {/* 3. Top Navigation Link: Return to Main Sanctum */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-5 sm:px-8 pt-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm tracking-wide text-[#b9b0bd] hover:text-white transition group"
        >
          <ArrowLeft className="w-4 h-4 text-[#c4a6d2] transition-transform group-hover:-translate-x-1" />
          <span>Back to AI Traitors</span>
        </Link>
      </div>

      {/* 4. Main 2-Column Authentication Layout */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-16 my-auto flex justify-center">
        <div className="w-full">
          <Suspense fallback={<div className="w-full max-w-[440px] h-96 rounded-2xl bg-[#19151d] border border-white/10" />}>
            <AuthCard initialMode={defaultMode} onModeChange={(mode) => setCurrentMode(mode)} />
          </Suspense>
        </div>
      </div>

      {/* 5. Minimal Bottom Footer Note */}
      <footer className="py-5 text-center text-xs text-[#817986]">AI Traitors</footer>
    </main>
  );
}
