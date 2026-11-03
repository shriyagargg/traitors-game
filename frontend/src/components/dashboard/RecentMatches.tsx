import React from "react";
import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";
import { RecentMatch } from "@/services/dashboard";
import { RoleAvatar } from "./RoleAvatar";

interface RecentMatchesProps {
  matches: RecentMatch[];
}

export function RecentMatches({ matches }: RecentMatchesProps) {
  return (
    <div className="flex flex-col h-full justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-cormorant text-xl sm:text-2xl font-normal text-text-main tracking-wide">
          Recent Matches
        </h3>
        <Link
          href="/dashboard/history"
          className="text-xs font-sans text-gold-antique hover:text-gold-light flex items-center gap-1 transition"
        >
          <span>View All</span>
          <span className="text-sm">→</span>
        </Link>
      </div>

      {/* Match Rows */}
      <div className="flex flex-col gap-2.5">
        {matches.map((match) => {
          const isFaithfulWin = match.winningTeam === "Faithful";

          return (
            <div
              key={match.id}
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#170C1B]/60 hover:bg-[#1C0E22] border border-gold-antique/15 hover:border-gold-antique/35 transition duration-200 cursor-pointer group"
            >
              {/* Left: Avatar + Title & Meta */}
              <div className="flex items-center gap-3">
                <RoleAvatar faction={match.winningTeam} className="w-9 h-9" />
                <div className="flex flex-col text-left">
                  <span
                    className={`text-xs sm:text-sm font-semibold tracking-wide ${
                      isFaithfulWin ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {match.winningTeam} Win
                  </span>
                  <span className="text-[11px] font-sans text-text-secondary/80">
                    {match.date} • {match.duration}
                  </span>
                </div>
              </div>

              {/* Right: Player count + Chevron */}
              <div className="flex items-center gap-3 text-text-secondary group-hover:text-gold-light transition-colors">
                <div className="flex items-center gap-1.5 text-xs font-sans">
                  <Users className="w-3.5 h-3.5 text-text-secondary/70" />
                  <span>{match.playerCount} Players</span>
                </div>
                <ChevronRight className="w-4 h-4 text-text-secondary/60 group-hover:text-gold-light group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
