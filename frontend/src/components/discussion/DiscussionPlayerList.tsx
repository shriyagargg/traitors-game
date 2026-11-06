"use client";

import React from "react";
import Image from "next/image";
import { Users, Crown } from "lucide-react";
import { DiscussionPlayer } from "@/types/discussion";

interface DiscussionPlayerListProps {
  players: DiscussionPlayer[];
  onTogglePlayerStatus?: (playerId: string) => void;
}

export function DiscussionPlayerList({
  players,
  onTogglePlayerStatus,
}: DiscussionPlayerListProps) {
  return (
    <div className="w-full h-full rounded-3xl border border-white/10 bg-[#120A14]/90 backdrop-blur-xl p-5 flex flex-col shadow-[0_4px_30px_rgba(20,9,28,0.5)]">
      {/* 1. Header */}
      <div className="flex items-center gap-2.5 pb-4 mb-3 border-b border-gold-antique/10">
        <div className="w-8 h-8 rounded-xl bg-[#1A0E1C] border border-gold-antique/30 flex items-center justify-center shrink-0">
          <Users className="w-4 h-4 text-gold-antique" />
        </div>
        <h2 className="font-cormorant text-xl font-bold tracking-wide text-[#F5EEDC]">
          Players ({players.length})
        </h2>
      </div>

      {/* 2. Compact Player Rows */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gold-antique/15">
        {players.map((player) => {
          const isCurrentUser = player.isCurrentUser;

          return (
            <div
              key={player.id}
              onClick={() => onTogglePlayerStatus?.(player.id)}
              className={`w-full px-3 py-2.5 rounded-2xl flex items-center gap-3 transition-all duration-200 cursor-pointer ${
                isCurrentUser
                  ? "border border-gold-antique/70 bg-gradient-to-r from-[#1E1122] to-[#140A18] shadow-[0_0_15px_rgba(212,175,55,0.18)]"
                  : "border border-white/5 hover:border-gold-antique/30 bg-[#160B1A]/40 hover:bg-[#1A0E1C]"
              } ${!player.isAlive ? "opacity-45 grayscale" : ""}`}
              title={
                onTogglePlayerStatus
                  ? `Click to toggle ${player.name}'s status (Alive/Eliminated demo)`
                  : undefined
              }
            >
              {/* Circular Avatar */}
              <div
                className={`relative w-9 h-9 rounded-full overflow-hidden shrink-0 ${
                  isCurrentUser
                    ? "ring-1 ring-gold-antique"
                    : "ring-1 ring-white/10"
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

              {/* Player Username & Alive/Eliminated Indicator */}
              <div className="flex-1 flex flex-col text-left overflow-hidden">
                <div className="flex items-center gap-1.5">
                  {player.isHost && (
                    <Crown className="w-3.5 h-3.5 text-gold-antique shrink-0" />
                  )}
                  <span
                    className={`text-xs sm:text-sm font-semibold truncate ${
                      isCurrentUser ? "text-gold-light" : "text-[#F5EEDC]"
                    }`}
                  >
                    {player.name}
                  </span>
                </div>

                {/* Status Dot */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      player.isAlive ? "bg-emerald-400" : "bg-zinc-500"
                    }`}
                  />
                  <span className="text-[11px] font-sans text-text-secondary/80">
                    {player.isAlive ? "Alive" : "Eliminated"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
