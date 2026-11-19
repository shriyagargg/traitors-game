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
        background: "#100d13",
        "bg-secondary": "#1b171f",
        "burgundy-deep": "#2a1d2d",
        "purple-muted": "#60466a",
        "purple-glow": "#8b6f96",
        "gold-antique": "#b99ca5",
        "gold-light": "#e1cbd4",
        "text-main": "#f5f1f7",
        "text-secondary": "#b9b0bd",
      },
      fontFamily: {
        cinzel: ["var(--font-cinzel)", "Cinzel", "Georgia", "serif"],
        cormorant: [
          "var(--font-cormorant)",
          "Cormorant Garamond",
          "Garamond",
          "Georgia",
          "serif",
        ],
        sans: [
          "var(--font-inter)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      boxShadow: {
        "gold-soft": "0 0 25px rgba(212, 175, 55, 0.25)",
        "gold-button": "0 0 20px rgba(212, 175, 55, 0.35)",
        "purple-halo": "0 0 40px rgba(139, 74, 168, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
