"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  applyTheme,
  resolveTheme,
  storedTheme,
  systemTheme,
  THEME_KEY,
  type Theme,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Start from dark to match SSR markup; the inline no-flash script has already
  // applied the correct class, and the effect below syncs React state on mount.
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    setThemeState(resolveTheme());
  }, []);

  // While the user is still on "follow OS" (no stored choice), react to OS changes.
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (storedTheme() === null) {
        const next = systemTheme();
        applyTheme(next);
        setThemeState(next);
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function setTheme(next: Theme) {
    window.localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    setThemeState(next);
  }

  function toggle() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
