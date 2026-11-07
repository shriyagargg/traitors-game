"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import { VotingTarget } from "@/types/votingPhase";

interface VotingActionPanelProps {
  targets: VotingTarget[];
  selectedTargetId: string | null;
  isSubmitted: boolean;
  submittedTargetName: string | null;
  onSelectTarget: (id: string) => void;
  onSubmitVote: () => Promise<{ success: boolean; message: string }>;
}

export function VotingActionPanel({
  targets,
  selectedTargetId,
  isSubmitted,
  submittedTargetName,
  onSelectTarget,
  onSubmitVote,
}: VotingActionPanelProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (loading || isSubmitted || !selectedTargetId) return;
    setLoading(true);
    await onSubmitVote();
    setLoading(false);
  };

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-[#120A14]/90 backdrop-blur-xl p-6 sm:p-8 flex flex-col items-center justify-between text-center shadow-[0_4px_30px_rgba(20,9,28,0.5)] min-h-[380px]">
      {/* 1. Header: Cast Your Vote */}
      <div className="flex flex-col items-center mb-6">
        <h2 className="font-cormorant text-2xl sm:text-3xl font-bold tracking-wide text-gold-light">
          Cast Your Vote
        </h2>
        <p className="text-xs sm:text-sm font-sans text-text-secondary mt-1">
          Choose one player you suspect to be a Traitor.
        </p>
      </div>

      {/* 2. Selectable Eligible Targets (Living Players Excluding Self) */}
      {!isSubmitted ? (
        <div className="w-full my-auto py-2">
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-7 md:gap-9">
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
                    className={`relative w-14 h-14 rounded-full overflow-hidden transition-all duration-300 ${
                      isSelected
                        ? "ring-2 ring-gold-antique shadow-[0_0_20px_rgba(212,175,55,0.5)]"
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
                    className={`text-xs sm:text-sm font-semibold mt-2.5 transition-colors ${
                      isSelected ? "text-gold-light" : "text-[#F5EEDC]"
                    }`}
                  >
                    {player.name}
                  </span>

                  {/* Radio Indicator */}
                  <div className="mt-2 flex items-center justify-center">
                    {isSelected ? (
                      <div className="w-4 h-4 rounded-full border border-gold-light bg-gold-antique shadow-[0_0_8px_rgba(212,175,55,0.8)] flex items-center justify-center">
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
        /* Vote Submitted Waiting State */
        <div className="my-auto py-6 flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-gold-antique/15 border border-gold-antique/40 flex items-center justify-center mb-3 shadow-[0_0_25px_rgba(212,175,55,0.3)]">
            <CheckCircle2 className="w-8 h-8 text-gold-light" />
          </div>
          <h3 className="font-cinzel text-xl sm:text-2xl font-bold tracking-wide text-gold-light">
            Vote Submitted
          </h3>
          <p className="text-xs sm:text-sm font-sans text-text-secondary mt-1.5 max-w-md leading-relaxed">
            Your vote has been recorded. Waiting for other players...
          </p>
          {submittedTargetName && (
            <span className="mt-3.5 px-3.5 py-1 rounded-full bg-[#1A0E1C] border border-gold-antique/30 text-xs font-mono text-gold-light">
              Your Ballot: {submittedTargetName}
            </span>
          )}
          <div className="mt-4 flex items-center gap-1.5 text-[11px] font-mono text-text-secondary/50">
            <Lock className="w-3 h-3 text-gold-antique/60" />
            <span>Ballots remain confidential until voting concludes</span>
          </div>
        </div>
      )}

      {/* 3. Submit Vote Button */}
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
                <span>Submitting Ballot...</span>
              </>
            ) : (
              <span>Submit Vote</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
