"use client";

import React from "react";
import Image from "next/image";
import { Check, X, User, Trash2 } from "lucide-react";
import { CrownIcon } from "../CrownIcon";
import { LobbyPlayer } from "@/types/lobby";
import { PlayerCapacity } from "@/services/rooms";

interface PlayerSlotsRowProps {
  players: LobbyPlayer[];
  capacity: PlayerCapacity;
  onToggleReady: (playerId: string) => void;
  currentUserId?: string;
  isHost?: boolean;
  onRemoveTestPlayer?: (playerId: string) => void;
}

export function PlayerSlotsRow({
  players,
  capacity,
  onToggleReady,
  currentUserId,
  isHost = false,
  onRemoveTestPlayer,
}: PlayerSlotsRowProps) {
  // Map player into slot index or fallback by order so no player is ever hidden
  const assignedIds = new Set<string>();
  const slots: (LobbyPlayer | null)[] = Array.from({ length: capacity }, (_, idx) => {
    // 1. Try finding player explicitly matching slotIndex
    let player = players.find((p) => p.slotIndex === idx && !assignedIds.has(p.id));
    // 2. If not found, find first unassigned player
    if (!player) {
      player = players.find((p) => !assignedIds.has(p.id));
    }
    if (player) {
      assignedIds.add(player.id);
      return player;
    }
    return null;
  });

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 items-stretch">
        {slots.map((player, slotIndex) => {
          if (!player) {
            // Empty / Waiting Slot Card
            return (
              <div
                key={`empty_slot_${slotIndex}`}
                className="relative rounded-2xl border border-dashed border-white/10 bg-[#161219]/40 backdrop-blur-sm p-4 flex flex-col items-center justify-center text-center min-h-[210px] transition-all hover:border-[#b99ca5]/30 group"
              >
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full border border-dashed border-white/10 flex items-center justify-center mb-3 bg-[#110d14]/60 group-hover:border-[#b99ca5]/40 transition-colors">
                  <User className="w-5 h-5 text-[#b9b0bd]/30 group-hover:text-[#b99ca5]/60 transition-colors" />
                </div>
                <span className="text-xs font-sans text-[#b9b0bd]/60 font-medium">
                  Waiting for Player
                </span>
                <span className="text-[10px] font-mono text-[#b9b0bd]/40 mt-1 uppercase tracking-wider">
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
              className={`relative rounded-2xl p-4 flex flex-col items-center justify-between text-center min-h-[210px] transition-all duration-300 ${
                isHost
                  ? "border border-[#b99ca5]/60 bg-gradient-to-b from-[#211524] to-[#140e17] shadow-[0_4px_24px_rgba(185,156,165,0.15)]"
                  : isCurrentUser
                  ? "border border-[#c4a6d2]/50 bg-[#19131d] shadow-[0_4px_20px_rgba(20,9,28,0.3)]"
                  : "border border-white/10 bg-[#161219]/90 hover:border-white/20 shadow-sm"
              }`}
            >
              {/* Top floating Host Crown */}
              {isHost && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#120A14] px-2.5 py-0.5 rounded-full border border-[#b99ca5]/60 shadow-md flex items-center gap-1 z-10">
                  <CrownIcon className="w-3 h-3 text-gold-light" />
                  <span className="font-cinzel text-[8px] font-bold tracking-widest text-gold-light uppercase">
                    HOST
                  </span>
                </div>
              )}

              {/* Avatar Section */}
              <div className="relative mt-1 mb-2">
                <div
                  className={`relative w-13 h-13 sm:w-14 sm:h-14 rounded-full overflow-hidden ${
                    isHost
                      ? "ring-2 ring-[#b99ca5] ring-offset-2 ring-offset-[#140e17]"
                      : isCurrentUser
                      ? "ring-2 ring-[#c4a6d2]/80 ring-offset-2 ring-offset-[#19131d]"
                      : "ring-1 ring-white/15"
                  }`}
                >
                  {player.avatarUrl ? (
                    <Image
                      src={player.avatarUrl}
                      alt={player.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#2a1d2d] flex items-center justify-center text-white font-bold text-sm">
                      {player.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {player.isAI && <span className="mb-1 rounded-full border border-purple-400/30 bg-purple-950/40 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-purple-200">Test Player</span>}

              {/* Player Name and Badges */}
              <div className="flex flex-col items-center w-full px-1 my-auto">
                <div className="flex items-center justify-center gap-1.5 w-full">
                  <span className="text-sm font-semibold text-white truncate max-w-[120px] sm:max-w-[140px]" title={player.name}>
                    {player.name}
                  </span>
                  {isCurrentUser && (
                    <span className="text-[9px] font-mono uppercase bg-[#c4a6d2]/20 text-[#c4a6d2] px-1.5 py-0.2 rounded border border-[#c4a6d2]/30">
                      You
                    </span>
                  )}
                </div>

                {/* Connection Status indicator */}
                <div className="flex items-center gap-1 mt-1 text-[11px] text-[#b9b0bd]/70">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      player.isConnected
                        ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
                        : "bg-amber-400/80"
                    }`}
                  />
                  <span>{player.isAI ? "AI participant" : player.isConnected ? "Connected" : "Reconnecting"}</span>
                </div>
              </div>
              {isHost && player.isAI && onRemoveTestPlayer && <button type="button" onClick={() => onRemoveTestPlayer(player.id)} className="mt-2 inline-flex items-center gap-1 rounded-lg border border-rose-400/20 px-2 py-1 text-[10px] font-medium text-rose-300/80 hover:border-rose-400/50 hover:text-rose-200" title="Remove this test player"><Trash2 className="h-3 w-3"/>Remove bot</button>}

              {/* Ready / Not Ready Toggle (Interactive for Current User, Status Pill for others) */}
              <div className="w-full mt-3">
                {isCurrentUser ? (
                  <button
                    type="button"
                    onClick={() => onToggleReady(player.id)}
                    className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 shadow-sm cursor-pointer ${
                      player.isReady
                        ? "bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80 hover:border-emerald-400"
                        : "bg-[#251928] border border-white/15 text-[#c7bac8] hover:bg-[#341d38] hover:text-white hover:border-[#b99ca5]/40"
                    }`}
                    title="Click to toggle your Ready status"
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
                ) : (
                  <div
                    className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 select-none ${
                      player.isReady
                        ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-400/90"
                        : "bg-[#1b141f] border border-white/5 text-[#b9b0bd]/50"
                    }`}
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
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
