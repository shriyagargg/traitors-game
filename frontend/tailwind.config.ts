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
        background: "#09060D",
        "bg-secondary": "#120A14",
        "burgundy-deep": "#24101F",
        "purple-muted": "#54265F",
        "purple-glow": "#8B4AA8",
        "gold-antique": "#D4AF37",
        "gold-light": "#F2D89A",
        "text-main": "#F5EEDC",
        "text-secondary": "#C7BAC8",
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
