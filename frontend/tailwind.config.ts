import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#070709",
        charcoal: {
          900: "#0f0f14",
          800: "#171720",
          700: "#242432",
        },
        burgundy: {
          950: "#1a060e",
          900: "#2b0a17",
          800: "#4a0e26",
          700: "#881337",
        },
        architect: {
          purple: "#2a124d",
          deep: "#150927",
          glow: "#9333ea",
        },
        gold: {
          accent: "#d4af37",
          light: "#f3e5ab",
          muted: "#997d29",
        },
      },
      fontFamily: {
        cinematic: ["Georgia", "serif"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
