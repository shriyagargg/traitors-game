import React from "react";
import { RoleStat } from "@/services/dashboard";

interface RoleDonutChartProps {
  stats: RoleStat[];
  totalGames: number;
}

export function RoleDonutChart({ stats, totalGames }: RoleDonutChartProps) {
  // SVG Donut geometry
  const size = 130;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2; // (130 - 16) / 2 = 57
  const circumference = 2 * Math.PI * radius; // ~358.14

  let accumulatedOffset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-5 w-full pt-1">
      {/* SVG Donut Circle with Central Counter */}
      <div className="relative flex items-center justify-center shrink-0 w-32 h-32">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Base background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#1C0E22"
            strokeWidth={strokeWidth}
          />

          {/* Sliced Segments */}
          {stats.map((item) => {
            const strokeDash = (item.percentage / 100) * circumference;
            const currentOffset = accumulatedOffset;
            accumulatedOffset += strokeDash;

            return (
              <circle
                key={item.role}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${strokeDash} ${circumference}`}
                strokeDashoffset={-currentOffset}
                strokeLinecap="butt"
                className="transition-all duration-500 hover:opacity-90"
              />
            );
          })}
        </svg>

        {/* Center Total Count */}
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
          <span className="font-cinzel text-2xl font-bold text-text-main leading-none">
            {totalGames}
          </span>
          <span className="text-[11px] font-sans text-text-secondary uppercase tracking-wider mt-0.5">
            Games
          </span>
        </div>
      </div>

      {/* Legend on the Right */}
      <div className="flex flex-col gap-2 w-full max-w-[160px]">
        {stats.map((item) => (
          <div
            key={item.role}
            className="flex items-center justify-between text-xs font-sans text-text-main"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-text-secondary">{item.role}</span>
            </div>
            <span className="font-medium text-text-main">
              {item.count}{" "}
              <span className="text-text-secondary/70">({item.percentage}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
