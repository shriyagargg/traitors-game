"use client";

import React from "react";
import Image from "next/image";
import { RevealedPlayer } from "@/types/victory";
import { Shield, Skull, Search, HeartPulse, Check, X } from "lucide-react";

interface RosterRoleRevealGridProps {
  players: RevealedPlayer[];
}

export function RosterRoleRevealGrid({ players }: RosterRoleRevealGridProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Traitor":
        return <Skull className="w-3.5 h-3.5 text-red-400" />;
      case "Detective":
        return <Search className="w-3.5 h-3.5 text-purple-300" />;
      case "Doctor":
        return <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-gold-light" />;
    }
  };

  const getRoleBadgeClasses = (role: string) => {
    switch (role) {
      case "Traitor":
        return "bg-red-950/70 border-red-500/50 text-red-300";
      case "Detective":
        return "bg-purple-950/70 border-purple-500/50 text-purple-200";
      case "Doctor":
        return "bg-emerald-950/70 border-emerald-500/50 text-emerald-300";
      default:
        return "bg-amber-950/50 border-gold-antique/40 text-gold-light";
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div>
          <h3 className="font-cormorant text-xl sm:text-2xl font-bold tracking-wide text-gold-light">
            The Grand Unmasking
          </h3>
          <p className="text-xs font-sans text-text-secondary/70">
            True identities and final status of all participants
          </p>
        </div>
        <span className="text-xs font-mono text-text-secondary/60">
          {players.length} Players Recorded
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {players.map((player) => {
          const isTraitor = player.role === "Traitor";
          const isAlive = player.status === "SURVIVED";

          return (
            <div
              key={player.id}
              className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-3 ${
                isTraitor
                  ? "bg-gradient-to-b from-[#240D15]/80 to-[#14060B]/90 border-red-500/30 hover:border-red-500/60 shadow-[0_0_15px_rgba(220,38,38,0.15)]"
                  : player.isCurrentUser
                  ? "bg-gradient-to-b from-[#1E1229]/80 to-[#120A18]/90 border-gold-antique/50 hover:border-gold-antique shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                  : "bg-[#140A18]/70 border-white/10 hover:border-white/20"
              }`}
            >
              {/* Top: Avatar, Name & Alive Status */}
              <div className="flex items-center gap-3">
                <div
                  className={`relative w-12 h-12 rounded-full overflow-hidden shrink-0 ${
                    isTraitor
                      ? "ring-2 ring-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                      : "ring-1 ring-white/20"
                  }`}
                >
                  <Image
                    src={player.avatarUrl}
                    alt={player.name}
                    fill
                    unoptimized
                    className={`object-cover ${isAlive ? "" : "grayscale"}`}
                  />
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-[#F5EEDC] truncate">
                    {player.name}
                  </span>
                  <span
                    className={`text-[11px] font-sans flex items-center gap-1 ${
                      isAlive ? "text-emerald-400" : "text-text-secondary/60"
                    }`}
                  >
                    {isAlive ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>{player.statusRoundText}</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3 text-red-400" />
                        <span>{player.statusRoundText}</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Bottom: True Role Reveal Badge */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-sans text-text-secondary/60 uppercase tracking-wider">
                  Secret Role
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-cinzel font-bold tracking-wider ${getRoleBadgeClasses(
                    player.role
                  )}`}
                >
                  {getRoleIcon(player.role)}
                  <span>{player.role}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

