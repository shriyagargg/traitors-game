"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  Shield,
  CheckCircle2,
  Loader2,
  Lock,
} from "lucide-react";
import { DramaMaskIcon } from "../game/DramaMaskIcon";
import { NightRoleConfig, NightPlayerTarget } from "@/types/nightPhase";

interface RoleActionPanelProps {
  config: NightRoleConfig;
  targets: NightPlayerTarget[];
  selectedTargetId: string | null;
  isSubmitted: boolean;
  submittedTargetName: string | null;
  investigationResult?: { targetName: string; isTraitor: boolean } | null;
  onSelectTarget: (id: string) => void;
  onSubmitAction: () => Promise<{ success: boolean; message: string }>;
}

export function RoleActionPanel({
  config,
  targets,
  selectedTargetId,
  isSubmitted,
  submittedTargetName,
  investigationResult,
  onSelectTarget,
  onSubmitAction,
}: RoleActionPanelProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (loading || isSubmitted || !selectedTargetId) return;
    setLoading(true);
    await onSubmitAction();
    setLoading(false);
  };

  // Render role header icon
  const renderRoleIcon = () => {
    switch (config.role) {
      case "traitor":
        return <DramaMaskIcon className="w-10 h-10 text-red-500 drop-shadow-[0_0_12px_rgba(220,38,38,0.6)]" />;
      case "doctor":
        return <Plus className="w-10 h-10 text-emerald-400 stroke-[3] drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]" />;
      case "detective":
        return <Search className="w-10 h-10 text-gold-antique stroke-[2.5] drop-shadow-[0_0_12px_rgba(212,175,55,0.6)]" />;
      case "faithful":
      default:
        return <Shield className="w-10 h-10 text-blue-400 stroke-[2] drop-shadow-[0_0_12px_rgba(96,165,250,0.6)]" />;
    }
  };

  // Faithful Waiting View
  if (config.role === "faithful") {
    return (
      <div className="w-full rounded-3xl border border-white/10 bg-[#120A14]/90 backdrop-blur-xl p-8 flex flex-col items-center justify-center text-center shadow-[0_4px_30px_rgba(20,9,28,0.5)] min-h-[380px]">
        <div className="w-16 h-16 rounded-full bg-blue-950/40 border border-blue-500/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(96,165,250,0.25)]">
          <Shield className="w-8 h-8 text-blue-400 animate-pulse" />
        </div>
        <h2 className="font-cinzel text-2xl font-bold tracking-wide text-blue-400 mb-2">
          {config.heading}
        </h2>
        <p className="text-sm font-sans text-text-secondary max-w-md leading-relaxed">
          {config.subtitle}
        </p>
        <div className="mt-6 flex items-center gap-2 text-xs font-mono text-text-secondary/60">
          <Lock className="w-3.5 h-3.5 text-blue-400/60" />
          <span>Chamber secured under silence protocol</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-[#120A14]/90 backdrop-blur-xl p-6 sm:p-8 flex flex-col items-center justify-between text-center shadow-[0_4px_30px_rgba(20,9,28,0.5)] min-h-[380px]">
      {/* 1. Header: Role Action Title & Subtitle */}
      <div className="flex flex-col items-center mb-6">
        <div className="mb-2">{renderRoleIcon()}</div>
        <h2
          style={{ color: config.accentColor }}
          className="font-cormorant text-2xl sm:text-3xl font-bold tracking-wide"
        >
          {config.heading}
        </h2>
        <p className="text-xs sm:text-sm font-sans text-text-secondary mt-1">
          {config.subtitle}
        </p>
      </div>

      {/* 2. Target Player Selection Row / Grid */}
      {!isSubmitted ? (
        <div className="w-full my-auto py-2">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-7">
            {targets.map((player) => {
              const isSelected = selectedTargetId === player.id;

              return (
                <div
                  key={player.id}
                  onClick={() => onSelectTarget(player.id)}
                  className="flex flex-col items-center cursor-pointer group transition-transform active:scale-95"
                >
                  {/* Circular Avatar */}
                  <div
                    className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden transition-all duration-300 ${
                      isSelected
                        ? config.ringClass
                        : "ring-1 ring-white/15 group-hover:ring-white/40"
                    }`}
                  >
                    <Image
                      src={player.avatarUrl}
                      alt={player.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>

                  {/* Player Name */}
                  <span
                    className={`text-xs sm:text-sm font-semibold mt-2 transition-colors ${
                      isSelected ? "text-gold-light" : "text-[#F5EEDC]"
                    }`}
                  >
                    {player.name}
                  </span>

                  {/* Radio Indicator */}
                  <div className="mt-1.5 flex items-center justify-center">
                    {isSelected ? (
                      <div
                        className={`w-4 h-4 rounded-full ${config.radioBgClass} flex items-center justify-center shadow-md`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/25 bg-transparent group-hover:border-white/50" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Action Submitted Confirmation View */
        <div className="my-auto py-4 flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-14 h-14 rounded-full bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <h3 className="font-cinzel text-xl font-bold tracking-wide text-emerald-300">
            Action Submitted
          </h3>
          <p className="text-xs sm:text-sm font-sans text-text-secondary mt-1 max-w-md leading-relaxed">
            Your decision has been recorded. Wait for the Architect to complete the night.
          </p>
          {submittedTargetName && (
            <span className="mt-3 px-3 py-1 rounded-full bg-[#1A0E1C] border border-gold-antique/30 text-xs font-mono text-gold-light">
              Selected Target: {submittedTargetName}
            </span>
          )}
        </div>
      )}

      {/* 3. Action Button */}
      {!isSubmitted && (
        <div className="w-full sm:w-72 mt-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedTargetId || loading}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-gold-light via-[#F3DEAA] to-gold-antique hover:from-gold-antique hover:to-gold-light text-[#09060D] font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 shadow-[0_0_25px_rgba(242,216,154,0.35)] hover:shadow-[0_0_35px_rgba(212,175,55,0.45)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-[#09060D]" />
                <span>Recording Decision...</span>
              </>
            ) : (
              <span>{config.buttonText}</span>
            )}
          </button>
        </div>
      )}
      {investigationResult && (
        <div className="mt-4 rounded-xl border border-gold-antique/30 bg-[#120A14] px-4 py-3 text-sm text-text-main" role="status">
          Investigation: <span className="font-semibold">{investigationResult.targetName}</span> is {investigationResult.isTraitor ? "a Traitor" : "not a Traitor"}.
        </div>
      )}
    </div>
  );
}
