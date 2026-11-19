import React from "react";
import { Trophy, Crown, Target, Users, Sparkles } from "lucide-react";
import { PlayerStats } from "@/services/dashboard";

interface StatsRowProps {
  stats: PlayerStats;
}

export function StatsRow({ stats }: StatsRowProps) {
  const statItems = [
    {
      icon: Trophy,
      value: stats.gamesPlayed.toString(),
      label: "Games Played",
    },
    {
      icon: Crown,
      value: stats.wins.toString(),
      label: "Wins",
    },
    {
      icon: Target,
      value: `${stats.winRate}%`,
      label: "Win Rate",
    },
    {
      icon: Users,
      value: stats.currentStreak.toString(),
      label: "Current Streak",
    },
    {
      icon: Sparkles,
      value: stats.reputation.toLocaleString(),
      label: "Reputation",
    },
  ];

  return (
    <div className="w-full rounded-2xl bg-[#19151d] border border-white/10 px-4 sm:px-6 py-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-2 items-center">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === statItems.length - 1;

          return (
            <div
              key={item.label}
              className={`flex items-center gap-3 px-3 py-1.5 ${
                !isLast ? "lg:border-r lg:border-gold-antique/15" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#28232d] border border-white/5 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-[#c4a6d2] stroke-[1.5]" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xl font-semibold tracking-tight text-white leading-tight">
                  {item.value}
                </span>
                <span className="text-[11px] sm:text-xs font-sans text-text-secondary/80">
                  {item.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
