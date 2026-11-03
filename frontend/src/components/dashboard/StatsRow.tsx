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
    <div className="w-full rounded-2xl bg-[#120A14]/70 border border-gold-antique/20 backdrop-blur-md px-4 sm:px-6 py-4 my-6 shadow-[0_4px_20px_rgba(18,10,20,0.5)]">
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
              <div className="w-10 h-10 rounded-xl bg-[#1A0E1C] border border-gold-antique/20 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-gold-antique stroke-[1.5]" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-cinzel text-lg sm:text-xl font-bold text-text-main leading-tight">
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
