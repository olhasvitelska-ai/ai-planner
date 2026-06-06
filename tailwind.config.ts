import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        skelar: {
          red:       "#FD3433",
          white:     "#FFFFFF",
          "blue-85": "#222631",
          "blue-75": "#3B404C",
          "blue-60": "#616672",
          n97:       "#060607",
          n85:       "#666667",
          n60:       "#4D4D4E",
          "sage-75": "#3B4437",
          "sage-60": "#606B5A",
          "violet-85": "#2B2232",
          "violet-75": "#453C4C",
          "violet-65": "#5E5565",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tight: "-0.02em",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
    },
  },
  plugins: [],
};

export default config;
