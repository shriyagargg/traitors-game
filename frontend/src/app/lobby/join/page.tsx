import React from "react";
import Link from "next/link";
import { Users, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function JoinGamePlaceholder() {
  return (
    <main className="min-h-screen bg-background text-text-main flex flex-col justify-between">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-xl mx-auto py-16">
        <div className="w-16 h-16 rounded-2xl bg-bg-secondary border border-gold-antique/40 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
          <Users className="w-8 h-8 text-gold-antique" />
        </div>
        <h1 className="font-cinzel text-3xl sm:text-4xl font-bold tracking-wider text-gold-gradient mb-3">
          JOIN A GAME
        </h1>
        <p className="font-cormorant italic text-lg text-text-secondary mb-8">
          &ldquo;Enter your secret room code to claim your seat at the council table.&rdquo;
        </p>
        <div className="p-6 rounded-xl border border-purple-muted/40 bg-bg-secondary/70 backdrop-blur-md w-full mb-8">
          <p className="text-sm font-sans text-text-secondary leading-relaxed">
            Multiplayer Room Join module is scheduled for Phase 2 implementation.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-sans text-gold-antique hover:text-gold-light transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Landing Page</span>
        </Link>
      </div>
      <footer className="py-6 text-center text-xs font-sans text-text-secondary/60">
        AI TRAITORS • The Architect
      </footer>
    </main>
  );
}
