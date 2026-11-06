"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RevealTopHeader } from "./RevealTopHeader";
import { RevealPageHeading } from "./RevealPageHeading";
import { SecretRoleCard } from "./SecretRoleCard";
import { RoleInfoPanel } from "./RoleInfoPanel";
import { ContinueButton } from "./ContinueButton";
import { GameRole, PlayerSecretIdentity } from "@/types/roleReveal";
import {
  ROLE_CONFIGS,
  fetchSecretIdentity,
} from "@/services/roleRevealService";
import { ShieldAlert, Sparkles, Radio } from "lucide-react";

interface RoleRevealContainerProps {
  initialRoomCode?: string;
  initialRole?: GameRole;
}

export function RoleRevealContainer({
  initialRoomCode = "A7K4D9",
  initialRole = "traitor",
}: RoleRevealContainerProps) {
  const router = useRouter();

  const [identity, setIdentity] = useState<PlayerSecretIdentity>({
    playerId: "p_somya",
    playerName: "Somya",
    roomCode: initialRoomCode,
    roundNumber: 1,
    role: initialRole,
    isMock: true,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchSecretIdentity(initialRoomCode, initialRole).then((data) => {
      if (isMounted) {
        setIdentity(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [initialRoomCode, initialRole]);

  // Handle switching role for evaluator/demo testing
  const handleSwitchRole = (newRole: GameRole) => {
    setIdentity((prev) => ({
      ...prev,
      role: newRole,
    }));
  };

  const handleContinue = () => {
    // In Phase 7 this navigates to the Night Phase gameplay room
    router.push(`/game?room=${identity.roomCode}`);
  };

  const currentConfig = ROLE_CONFIGS[identity.role] || ROLE_CONFIGS.traitor;

  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col selection:bg-purple-muted selection:text-gold-light relative overflow-x-hidden">
      {/* 1. Cinematic Background Vignette & Fog Layers */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-75"
        style={{
          background:
            "radial-gradient(ellipse 95% 75% at 50% 15%, #24101F 0%, #120A14 45%, #09060D 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-28 -left-20 w-[500px] h-[400px] rounded-full bg-purple-muted/15 blur-[140px] z-0"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-28 -right-20 w-[500px] h-[400px] rounded-full bg-burgundy-deep/25 blur-[140px] z-0"
        aria-hidden="true"
      />

      {/* 2. Hooded Architect Silhouette on Far Left Background */}
      <div className="pointer-events-none fixed top-1/2 -translate-y-1/2 left-0 sm:left-4 md:left-8 w-[240px] h-[290px] opacity-40 lg:opacity-75 z-0 transition-opacity duration-1000">
        <div className="relative w-full h-full">
          <Image
            src="/images/architect_reveal_left.png"
            alt="The Architect"
            fill
            unoptimized
            className="object-contain"
          />
        </div>
      </div>

      {/* 3. Compact Top Match Header */}
      <RevealTopHeader
        roomCode={identity.roomCode}
        roundNumber={identity.roundNumber}
        playerName={identity.playerName}
      />

      {/* 4. Main Body */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 z-10 flex flex-col justify-between">
        {/* Page Heading */}
        <RevealPageHeading />

        {/* Two-Column Role Reveal Presentation */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 my-auto py-4">
          {/* Left Column: The Secret Role Card */}
          <div className="w-full flex justify-center lg:justify-end">
            <SecretRoleCard config={currentConfig} />
          </div>

          {/* Right Column: The Role Information Panel */}
          <div className="w-full flex justify-center lg:justify-start">
            <RoleInfoPanel config={currentConfig} />
          </div>
        </div>

        {/* Bottom Continue Action */}
        <ContinueButton onContinue={handleContinue} disabled={loading} />

        {/* Evaluator & Demonstration Role Switcher Toolbar */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 pt-3 mt-4 border-t border-gold-antique/10 text-[11px] font-sans text-text-secondary/70">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-gold-antique" />
            <span className="text-gold-light/80">Security Protocol:</span>
            <span className="bg-[#1A0E1C] px-2 py-0.5 rounded border border-gold-antique/25 font-mono text-[10px] text-text-main">
              Secret Individual Delivery (Zero Leakage)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-text-secondary/50">Preview All Roles:</span>
            <button
              onClick={() => handleSwitchRole("traitor")}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition border ${
                identity.role === "traitor"
                  ? "bg-red-950/80 border-red-500 text-red-300 shadow-[0_0_8px_rgba(220,38,38,0.4)]"
                  : "bg-[#1A0E1C] border-white/10 text-text-secondary hover:text-red-400"
              }`}
            >
              Traitor
            </button>
            <button
              onClick={() => handleSwitchRole("doctor")}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition border ${
                identity.role === "doctor"
                  ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                  : "bg-[#1A0E1C] border-white/10 text-text-secondary hover:text-emerald-400"
              }`}
            >
              Doctor
            </button>
            <button
              onClick={() => handleSwitchRole("detective")}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition border ${
                identity.role === "detective"
                  ? "bg-amber-950/80 border-gold-antique text-gold-light shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                  : "bg-[#1A0E1C] border-white/10 text-text-secondary hover:text-gold-light"
              }`}
            >
              Detective
            </button>
            <button
              onClick={() => handleSwitchRole("faithful")}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition border ${
                identity.role === "faithful"
                  ? "bg-blue-950/80 border-blue-500 text-blue-300 shadow-[0_0_8px_rgba(96,165,250,0.4)]"
                  : "bg-[#1A0E1C] border-white/10 text-text-secondary hover:text-blue-400"
              }`}
            >
              Faithful
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
