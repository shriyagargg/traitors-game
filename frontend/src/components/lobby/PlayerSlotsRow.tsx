"use client";

import React from "react";
import Image from "next/image";
import { Check, X, User } from "lucide-react";
import { CrownIcon } from "../CrownIcon";
import { LobbyPlayer } from "@/types/lobby";
import { PlayerCapacity } from "@/services/rooms";

interface PlayerSlotsRowProps {
  players: LobbyPlayer[];
  capacity: PlayerCapacity;
  onToggleReady: (playerId: string) => void;
  currentUserId?: string;
}

export function PlayerSlotsRow({
  players,
  capacity,
  onToggleReady,
  currentUserId,
}: PlayerSlotsRowProps) {
  // Generate total slots according to capacity (6, 7, or 8)
  const slots = Array.from({ length: capacity }, (_, idx) => {
    return players.find((p) => p.slotIndex === idx) || null;
  });

  return (
    <div className="w-full">
      {/* Horizontal Player Slots Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-3.5 items-stretch">
        {slots.map((player, slotIndex) => {
          if (!player) {
            // Empty / Waiting Slot
            return (
              <div
                key={`empty_${slotIndex}`}
                className="relative rounded-2xl border border-dashed border-gold-antique/20 bg-[#120A14]/40 backdrop-blur-sm p-4 flex flex-col items-center justify-center text-center h-[200px] transition-all hover:border-gold-antique/30"
              >
                <div className="w-14 h-14 rounded-full border border-dashed border-text-secondary/20 flex items-center justify-center mb-3">
                  <User className="w-6 h-6 text-text-secondary/40" />
                </div>
                <span className="text-xs font-sans text-text-secondary/50 font-normal">
                  Waiting...
                </span>
                <span className="text-[10px] text-text-secondary/30 mt-1">
                  Slot {slotIndex + 1}
                </span>
              </div>
            );
          }

          const isHost = player.isHost;
          const isCurrentUser = player.id === currentUserId || player.isCurrentUser;

          return (
            <div
              key={player.id}
              className={`relative rounded-2xl p-3.5 flex flex-col items-center justify-between text-center h-[200px] transition-all duration-300 ${
                isHost
                  ? "border-2 border-gold-antique bg-gradient-to-b from-[#1C1020] to-[#120A14] shadow-[0_0_20px_rgba(212,175,55,0.22)]"
                  : "border border-white/10 bg-[#120A14]/90 hover:border-gold-antique/30 shadow-sm"
              }`}
            >
              {/* Crown Indicator for Host floating on top */}
              {isHost && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#09060D] px-2 py-0.5 rounded-full border border-gold-antique/50 shadow-md flex items-center gap-1 z-10">
                  <CrownIcon className="w-3.5 h-3.5 text-gold-antique" />
                </div>
              )}

              {/* Avatar with Circular Ring */}
              <div className="relative mt-2">
                <div
                  className={`relative w-14 h-14 rounded-full overflow-hidden ${
                    isHost
                      ? "ring-2 ring-gold-antique/80 ring-offset-2 ring-offset-[#120A14]"
                      : "ring-1 ring-white/15"
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

                {/* Host Badge under Avatar */}
                {isHost && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#28180A] border border-gold-antique/70 px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 whitespace-nowrap">
                    <CrownIcon className="w-2.5 h-2.5 text-gold-antique" />
                    <span className="font-cinzel text-[9px] font-bold tracking-wider text-gold-light uppercase">
                      HOST
                    </span>
                  </div>
                )}
              </div>

              {/* Player Username & You indicator */}
              <div className="flex flex-col items-center mt-3 mb-1">
                <span className="text-sm font-semibold text-[#F5EEDC] tracking-wide">
                  {player.name}
                </span>
                <span className={`mt-1 flex items-center gap-1 text-[10px] ${player.isConnected ? "text-emerald-400/80" : "text-text-secondary/60"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${player.isConnected ? "bg-emerald-400" : "bg-text-secondary/40"}`} />
                  {player.isConnected ? "Connected" : "Reconnecting"}
                </span>
                {isCurrentUser && (
                  <span className="text-[10px] text-gold-antique/80 font-medium">
                    (You)
                  </span>
                )}
              </div>

              {/* Status Badge: Ready / Not Ready (Interactive Click to Toggle) */}
              <button
                type="button"
                onClick={() => isCurrentUser && onToggleReady(player.id)}
                disabled={!isCurrentUser}
                className={`w-full py-1.5 px-2 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm ${
                  player.isReady
                    ? "bg-[#0c2a1c] border border-emerald-500/40 text-emerald-400 hover:bg-[#113826]"
                    : "bg-[#24101F] border border-white/15 text-[#C7BAC8] hover:bg-[#34162C]"
                }`}
                title={
                  isCurrentUser
                    ? "Click to toggle your Ready status"
                    : `${player.name}'s readiness`
                }
              >
                {player.isReady ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Ready</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5 stroke-[2]" />
                    <span>Not Ready</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
