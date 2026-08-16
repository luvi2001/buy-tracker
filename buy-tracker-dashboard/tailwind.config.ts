import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        panel: "#12161C",
        panel2: "#1A1F27",
        line: "#262C36",
        ink: "#E7EAEE",
        muted: "#8A93A3",
        accent: "#D9A441", // amber - production/manufacturing tracker accent
        good: "#4FAE7C",
        warn: "#D9A441",
        bad: "#E0645B",
        idle: "#5B6472",
      },
      fontFamily: {
        display: ["'IBM Plex Sans Condensed'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
