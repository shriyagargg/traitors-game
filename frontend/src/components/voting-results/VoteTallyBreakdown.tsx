"use client";

import React from "react";
import { VoteTallyItem } from "@/types/votingResults";
import { Shield, Skull, CheckCircle2 } from "lucide-react";

interface VoteTallyBreakdownProps {
  tallies: VoteTallyItem[];
  totalVotes: number;
  faithfulRemaining: number;
  traitorsRemaining: number;
}

export function VoteTallyBreakdown({
  tallies,
  totalVotes,
  faithfulRemaining,
  traitorsRemaining,
}: VoteTallyBreakdownProps) {
  return (
    <div className="w-full flex flex-col gap-4">
      {/* Tally Card Container */}
      <div className="rounded-3xl border border-white/10 bg-[#120A14]/90 backdrop-blur-xl p-5 sm:p-6 shadow-[0_4px_30px_rgba(20,9,28,0.5)]">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h2 className="font-cormorant text-xl sm:text-2xl font-bold tracking-wide text-gold-light">
            Council Ballot Tally
          </h2>
          <span className="text-xs font-mono text-text-secondary/70">
            {totalVotes} Total Votes
          </span>
        </div>

        {/* List of candidates with vote counts */}
        <div className="mt-4 flex flex-col gap-3.5">
          {tallies.map((item) => (
            <div
              key={item.targetId}
              className={`p-3.5 rounded-2xl border transition-all ${
                item.isBanished
                  ? "bg-gradient-to-r from-red-950/40 via-burgundy-deep/60 to-red-950/20 border-red-500/40 shadow-[0_0_20px_rgba(220,38,38,0.2)]"
                  : "bg-[#180E1C]/60 border-white/5 hover:border-white/15"
              }`}
            >
              {/* Candidate Info & Vote Count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`relative w-10 h-10 rounded-full overflow-hidden ${
                      item.isBanished
                        ? "ring-2 ring-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]"
                        : "ring-1 ring-white/15"
                    }`}
                  >
                    {item.targetAvatarUrl ? <img src={item.targetAvatarUrl} alt={item.targetName} className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center bg-[#2a1d2d] text-xs font-bold text-white">{item.targetName.slice(0, 2).toUpperCase()}</span>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#F5EEDC]">
                        {item.targetName}
                      </span>
                      {item.isBanished && (
                        <span className="px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/50 text-[10px] font-cinzel font-extrabold text-red-200 tracking-wider">
                          BANISHED
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-sans text-text-secondary/70">
                      {item.votesCount} {item.votesCount === 1 ? "vote" : "votes"} ({Math.round(item.percentage)}%)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-mono text-lg font-bold ${
                      item.isBanished ? "text-red-400" : "text-gold-light"
                    }`}
                  >
                    {item.votesCount}
                  </span>
                </div>
              </div>

              {/* Vote Percentage Progress Bar */}
              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    item.isBanished
                      ? "bg-gradient-to-r from-red-600 via-rose-500 to-amber-500"
                      : "bg-gradient-to-r from-gold-antique to-gold-light"
                  }`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>

              {/* Voters Who Cast Ballots for this candidate */}
              <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-sans text-text-secondary/60 mr-1">
                  Voted by:
                </span>
                {item.voters.map((voter) => (
                  <span
                    key={voter.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#24101F]/80 border border-gold-antique/15 text-[10px] text-text-main"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5 text-gold-antique" />
                    <span>{voter.name}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Council Roster Summary Card */}
      <div className="rounded-2xl border border-white/10 bg-[#120A14]/70 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase font-sans tracking-wider text-text-secondary/60">
              Faithful Remaining
            </span>
            <span className="font-mono text-base font-bold text-emerald-300">
              {faithfulRemaining} Alive
            </span>
          </div>
        </div>

        <div className="h-8 w-px bg-white/10" />

        <div className="flex items-center gap-2">
          <Skull className="w-4 h-4 text-red-400" />
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-sans tracking-wider text-text-secondary/60">
              Traitors Remaining
            </span>
            <span className="font-mono text-base font-bold text-red-400">
              {traitorsRemaining} in Shadows
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

