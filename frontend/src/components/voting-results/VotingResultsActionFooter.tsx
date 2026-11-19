"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Moon, Trophy, ArrowRight, Home, Loader2 } from "lucide-react";
import { GameOutcomeStatus } from "@/types/votingResults";
import { getApiBaseUrl } from "@/services/rooms";
import { getPlayerSession } from "@/services/playerSession";

interface VotingResultsActionFooterProps {
  roundNumber: number;
  gameOutcome: GameOutcomeStatus;
  isRoleRevealed: boolean;
  roomCode: string;
}

export function VotingResultsActionFooter({
  roundNumber,
  gameOutcome,
  isRoleRevealed,
  roomCode,
}: VotingResultsActionFooterProps) {
  const router = useRouter();
  const [isAdvancing, setIsAdvancing] = useState(false);
  const isVictory =
    gameOutcome === "FAITHFUL_VICTORY" || gameOutcome === "TRAITOR_VICTORY";

  const handleEnterNight = async () => {
    if (isAdvancing) return;
    setIsAdvancing(true);
    try {
      const session = getPlayerSession(roomCode);
      await fetch(`${getApiBaseUrl()}/api/v1/game/${encodeURIComponent(roomCode)}/advance-phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: session.id,
          token: session.token,
          account_token: session.accountToken,
        }),
      });
    } catch {
      // Backend will also advance on timer
    }
    router.push(`/game/night?room=${roomCode}&round=${roundNumber + 1}`);
  };

  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gold-antique/15">
      {/* Return Home / Dashboard Link */}
      <Link
        href="/dashboard"
        className="text-xs font-sans text-text-secondary/70 hover:text-gold-light flex items-center gap-1.5 transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>

      {/* Primary Proceed CTA */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {isVictory ? (
          <Link
            href={`/game/victory?room=${roomCode}&outcome=${gameOutcome}`}
            className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-gradient-to-r from-gold-light via-[#F3DEAA] to-gold-antique hover:from-gold-antique hover:to-gold-light text-[#09060D] font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 shadow-[0_0_25px_rgba(242,216,154,0.35)] hover:shadow-[0_0_35px_rgba(212,175,55,0.45)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <Trophy className="w-4 h-4 text-[#09060D]" />
            <span>View Victory &amp; Match Summary</span>
            <ArrowRight className="w-4 h-4 text-[#09060D]" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleEnterNight}
            disabled={isAdvancing}
            className={`w-full sm:w-auto py-3.5 px-8 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 ${
              isRoleRevealed
                ? "bg-gradient-to-r from-gold-light via-[#F3DEAA] to-gold-antique hover:from-gold-antique hover:to-gold-light text-[#09060D] shadow-[0_0_25px_rgba(242,216,154,0.35)] hover:shadow-[0_0_35px_rgba(212,175,55,0.45)] hover:scale-[1.02] active:scale-[0.98]"
                : "bg-[#24101F] border border-gold-antique/30 text-text-secondary hover:text-gold-light"
            }`}
          >
            {isAdvancing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Advancing to Night...</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" />
                <span>Enter Night Phase (Round {roundNumber + 1})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

