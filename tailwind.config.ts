import type { Config } from "tailwindcss";

// Theme-aware palette. Every shade resolves to a CSS variable (defined in
// app/globals.css) using the `rgb(var(--x) / <alpha-value>)` form so existing
// opacity modifiers like `/60` keep working. Light mode flips these variables;
// see globals.css. `ink` is a fixed dark token for text on bright accent fills
// that must stay dark in both themes.
const withVars = (name: string, shades: number[]) =>
  Object.fromEntries(
    shades.map((s) => [s, `rgb(var(--${name}-${s}) / <alpha-value>)`]),
  );

const NEUTRAL = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#020617",
        slate: withVars("slate", NEUTRAL),
        cyan: withVars("cyan", [300, 400, 500, 600]),
        teal: withVars("teal", [500]),
        emerald: withVars("emerald", [300, 400, 500]),
        red: withVars("red", [300, 400, 500]),
        orange: withVars("orange", [300, 400, 500]),
        amber: withVars("amber", [400, 500]),
        rose: withVars("rose", [400, 500]),
        violet: withVars("violet", [300, 400, 500]),
      },
    },
  },
  plugins: [],
};

export default config;
