"use client";

import React, { useEffect, useState } from "react";
import { Shield, Eye, Skull, Crosshair, Sparkles, Terminal, Users, Cpu } from "lucide-react";

interface HealthData {
  status: string;
  project: string;
  architect: string;
  version: string;
  peas_agent?: string;
}

export default function Home() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    // Health probe to backend
    fetch("http://localhost:8000/api/v1/health")
      .then((res) => res.json())
      .then((data) => {
        setHealth(data);
        setBackendOnline(true);
      })
      .catch(() => {
        setBackendOnline(false);
      });
  }, []);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between p-6 md:p-12 overflow-hidden">
      {/* Background Ambience / Atmospheric Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-b from-architect-purple/30 via-burgundy-900/20 to-transparent blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-10 h-[400px] w-[500px] rounded-full bg-burgundy-950/40 blur-[140px]" />

      {/* Header Bar */}
      <header className="z-10 flex w-full max-w-6xl items-center justify-between border-b border-charcoal-700/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-gold-accent/40 bg-charcoal-900 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
            <Cpu className="h-5 w-5 text-gold-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-zinc-100 font-cinematic">
              AI TRAITORS
            </h1>
            <p className="text-xs text-zinc-400 font-mono tracking-tight">
              THE ARCHITECT • AUTONOMOUS GAME MASTER
            </p>
          </div>
        </div>

        {/* Engine Status Badge */}
        <div className="flex items-center gap-2 rounded-full border border-charcoal-700 bg-charcoal-900/80 px-3 py-1.5 backdrop-blur-md">
          <span
            className={`h-2 w-2 rounded-full ${
              backendOnline === true
                ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                : backendOnline === false
                ? "bg-amber-400 shadow-[0_0_8px_#fbbf24]"
                : "bg-zinc-600 animate-pulse"
            }`}
          />
          <span className="text-xs font-mono text-zinc-300">
            {backendOnline === true
              ? `FastAPI: Connected (${health?.version ?? "v1.0.0"})`
              : backendOnline === false
              ? "FastAPI: Standby (Port 8000)"
              : "Checking Engine..."}
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <div className="z-10 my-auto flex max-w-4xl flex-col items-center text-center py-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold-accent/30 bg-gold-accent/10 px-4 py-1.5 text-xs font-medium text-gold-light mb-6 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-gold-accent" />
          The AI is not just playing the game. The AI is running the game.
        </div>

        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-100 font-cinematic max-w-3xl leading-tight">
          Where Deception Meets <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-accent via-gold-light to-amber-200">Autonomous Intelligence</span>
        </h2>

        <p className="mt-6 max-w-2xl text-base md:text-lg text-zinc-400 leading-relaxed">
          Step into a 6–8 player real-time social deduction arena overseen by 
          <span className="text-zinc-200 font-semibold"> The Architect</span> — an AI Game Master driven by 
          Constraint Satisfaction, logical contradiction detection, and multi-agent reasoning.
        </p>

        {/* Action Controls */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button className="flex items-center gap-2.5 rounded-lg border border-gold-accent/60 bg-gradient-to-r from-gold-accent/20 to-amber-600/20 px-7 py-3 text-sm font-semibold text-gold-light shadow-[0_0_20px_rgba(212,175,55,0.2)] transition hover:border-gold-accent hover:from-gold-accent/30 hover:to-amber-600/30">
            <Users className="h-4 w-4 text-gold-accent" />
            Create Match Room
          </button>
          <button className="flex items-center gap-2.5 rounded-lg border border-charcoal-700 bg-charcoal-900/90 px-7 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white">
            <Terminal className="h-4 w-4 text-zinc-400" />
            Join with Code
          </button>
        </div>
      </div>

      {/* Role Distribution Showcase */}
      <section className="z-10 w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
        {/* Traitor Card */}
        <div className="relative group overflow-hidden rounded-xl border border-burgundy-800/40 bg-gradient-to-b from-burgundy-950/40 to-charcoal-900/90 p-5 backdrop-blur-md transition hover:border-burgundy-700 hover:shadow-[0_0_25px_rgba(136,19,55,0.25)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-burgundy-900/60 border border-burgundy-700/50">
              <Skull className="h-5 w-5 text-rose-400" />
            </div>
            <span className="text-xs font-mono font-semibold text-rose-400 tracking-wider">
              2 PLAYERS
            </span>
          </div>
          <h3 className="text-lg font-bold text-zinc-100 font-cinematic">The Traitor</h3>
          <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
            Eliminates players in secret darkness. Coordinates via private encrypted channels while bluffing during daytime council.
          </p>
        </div>

        {/* Detective Card */}
        <div className="relative group overflow-hidden rounded-xl border border-architect-purple/40 bg-gradient-to-b from-architect-deep/40 to-charcoal-900/90 p-5 backdrop-blur-md transition hover:border-architect-glow/50 hover:shadow-[0_0_25px_rgba(147,51,234,0.2)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-architect-purple/60 border border-architect-glow/40">
              <Eye className="h-5 w-5 text-purple-300" />
            </div>
            <span className="text-xs font-mono font-semibold text-purple-300 tracking-wider">
              1 PLAYER
            </span>
          </div>
          <h3 className="text-lg font-bold text-zinc-100 font-cinematic">The Detective</h3>
          <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
            Investigates one suspect per night. Receives private verified intelligence to guide daytime accusations without being exposed.
          </p>
        </div>

        {/* Doctor Card */}
        <div className="relative group overflow-hidden rounded-xl border border-emerald-900/40 bg-gradient-to-b from-emerald-950/30 to-charcoal-900/90 p-5 backdrop-blur-md transition hover:border-emerald-700/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-950/60 border border-emerald-700/50">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-400 tracking-wider">
              1 PLAYER
            </span>
          </div>
          <h3 className="text-lg font-bold text-zinc-100 font-cinematic">The Doctor</h3>
          <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
            Selects one player to protect each night. Can thwart a Traitor strike if their target prediction is accurate.
          </p>
        </div>

        {/* Faithful Card */}
        <div className="relative group overflow-hidden rounded-xl border border-charcoal-700/60 bg-gradient-to-b from-charcoal-800/40 to-charcoal-900/90 p-5 backdrop-blur-md transition hover:border-zinc-500 hover:shadow-[0_0_25px_rgba(255,255,255,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-charcoal-800 border border-charcoal-600">
              <Crosshair className="h-5 w-5 text-sky-400" />
            </div>
            <span className="text-xs font-mono font-semibold text-sky-400 tracking-wider">
              2–4 PLAYERS
            </span>
          </div>
          <h3 className="text-lg font-bold text-zinc-100 font-cinematic">The Faithful</h3>
          <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
            The backbone of the council. Analyzes inconsistencies, cross-examines claims, and votes to banish all lurking Traitors.
          </p>
        </div>
      </section>

      {/* Footer Info */}
      <footer className="z-10 mt-12 w-full max-w-6xl border-t border-charcoal-700/50 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 font-mono">
        <p>AI TRAITORS • Academic Multi-Agent Engineering Project</p>
        <p className="mt-2 sm:mt-0">PEAS Framework • CSP Role Assignment • A* Planning • LangGraph</p>
      </footer>
    </main>
  );
}
