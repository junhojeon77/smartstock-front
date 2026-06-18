// Theme helpers. We persist the user's *choice* ("light" | "dark"); absence of a
// stored choice means "follow OS". The actual class applied to <html> is always a
// concrete "light" or "dark".

export type Theme = "light" | "dark";

export const THEME_KEY = "theme";

/** OS preference, defaulting to dark when unknown (SSR / no matchMedia). */
export function systemTheme(): Theme {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Stored choice, or null when the user hasn't picked one (= follow OS). */
export function storedTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(THEME_KEY);
  return v === "light" || v === "dark" ? v : null;
}

/** The theme to actually render: stored choice, else OS. */
export function resolveTheme(): Theme {
  return storedTheme() ?? systemTheme();
}

/** Toggle the `light`/`dark` class on <html>. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
}
