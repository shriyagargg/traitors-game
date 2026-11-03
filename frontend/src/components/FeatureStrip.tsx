import React from "react";
import { Users, Layers, Brain, BarChart3 } from "lucide-react";

export function FeatureStrip() {
  const features = [
    {
      icon: Users,
      title: "6 – 8 Players",
    },
    {
      icon: Layers,
      title: "4 Unique Roles",
    },
    {
      icon: Brain,
      title: "AI Game Master",
    },
    {
      icon: BarChart3,
      title: "Post-Game Analysis",
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mt-12 sm:mt-16 border-t border-gold-antique/25 pt-6 sm:pt-8 z-10 relative">
      <div className="grid grid-cols-2 md:grid-cols-4 items-center">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          const isLast = idx === features.length - 1;
          const isEven = idx % 2 === 1;

          return (
            <div
              key={feature.title}
              className={`flex flex-col items-center justify-center py-3 px-2 sm:px-4 ${
                !isLast ? "md:border-r md:border-gold-antique/20" : ""
              } ${!isEven ? "border-r border-gold-antique/20 md:border-none" : ""}`}
            >
              <div className="flex items-center justify-center h-8 w-8 mb-2">
                <Icon
                  className="w-6 h-6 text-gold-antique stroke-[1.5]"
                  aria-hidden="true"
                />
              </div>
              <span className="text-xs sm:text-sm font-medium tracking-wide text-text-main text-center font-sans">
                {feature.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
