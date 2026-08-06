"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  AUTOSYNC_KEY,
  DEFAULT_RESTOCK_DAYS,
  RESTOCK_CYCLES,
  RESTOCK_KEY,
} from "@/components/assistant/InventoryForecastTab";
import {
  DISMISSED_KEY,
  OVERRIDES_KEY,
} from "@/components/inventory/ReorderSuggestions";
import { getUser, normalizeRole } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

const card = "rounded-xl border border-slate-800/70 bg-slate-900/40 backdrop-blur-sm p-5";
const label = "text-xs font-medium text-slate-500 uppercase tracking-wide";
const selectCls =
  "rounded-xl border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-150";

/**
 * Count real entries behind a stored key. The writers persist `[]` / `{}`
 * rather than removing the key, so a bare existence check would leave these
 * buttons enabled with nothing to undo. Malformed JSON counts as empty.
 */
function countStored(storageKey: string): number {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return 0;
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.length;
    if (parsed !== null && typeof parsed === "object") {
      return Object.keys(parsed).length;
    }
    return 0;
  } catch {
    return 0;
  }
}

/** Reset button that shows its count, explains itself when empty, and confirms briefly. */
function ResetButton({
  storageKey,
  label,
  emptyHint,
}: {
  storageKey: string;
  label: string;
  emptyHint: string;
}) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setCount(countStored(storageKey));
  }, [storageKey]);

  // Clear the transient confirmation so the button doesn't read "Done" until
  // the page is remounted.
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setDone(false), 2000);
    return () => clearTimeout(timer);
  }, [done]);

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        disabled={count === 0}
        onClick={() => {
          localStorage.removeItem(storageKey);
          setCount(0);
          setDone(true);
        }}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700/60 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:border-slate-600 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {done ? "Done ✓" : count > 0 ? `${label} (${count})` : label}
      </button>
      {count === 0 && <p className="text-xs text-slate-600">{emptyHint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const { theme } = useTheme();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [restockDays, setRestockDays] = useState<number>(DEFAULT_RESTOCK_DAYS);
  const [autoSync, setAutoSync] = useState(false);

  useEffect(() => {
    setUser(getUser());
    const stored = Number(localStorage.getItem(RESTOCK_KEY));
    if (RESTOCK_CYCLES.some((c) => c.days === stored)) setRestockDays(stored);
    if (localStorage.getItem(AUTOSYNC_KEY) === "on") setAutoSync(true);
  }, []);

  function changeRestock(days: number) {
    setRestockDays(days);
    localStorage.setItem(RESTOCK_KEY, String(days));
  }

  function changeAutoSync(on: boolean) {
    setAutoSync(on);
    localStorage.setItem(AUTOSYNC_KEY, on ? "on" : "off");
  }

  return (
    <>
      <Topbar title="Settings" />
      <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-8 pt-6 flex flex-col gap-4 lg:gap-5 max-w-3xl">

        {/* Account */}
        <div className={card}>
          <h2 className="mb-4 text-sm font-semibold text-slate-200">Account</h2>
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className={label}>Name</dt>
              <dd className="text-slate-200">{user?.name ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className={label}>Email</dt>
              <dd className="text-slate-400">{user?.email ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className={label}>Role</dt>
              <dd>
                <span className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-400">
                  {normalizeRole(user?.role) ?? "—"}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Appearance */}
        <div className={card}>
          <h2 className="mb-4 text-sm font-semibold text-slate-200">Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300">
                Theme: <span className="capitalize text-slate-100">{theme}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Same toggle as the top bar — click to switch.
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Forecast & Restock */}
        <div className={card}>
          <h2 className="mb-4 text-sm font-semibold text-slate-200">
            Forecast &amp; Restock
          </h2>
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-300">Restock cycle</p>
                <p className="mt-1 text-xs text-slate-500">
                  Minimum stock levels scale to how often you restock.
                </p>
              </div>
              <select
                value={restockDays}
                onChange={(e) => changeRestock(Number(e.target.value))}
                className={selectCls}
                aria-label="Restock cycle"
              >
                {RESTOCK_CYCLES.map((c) => (
                  <option key={c.days} value={c.days}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-300">Auto-sync minimums</p>
                <p className="mt-1 text-xs text-slate-500">
                  Save AI-forecasted minimums as item thresholds automatically.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => changeAutoSync(e.target.checked)}
                aria-label="Auto-sync minimums"
                className="h-5 w-5 shrink-0 accent-cyan-500"
              />
            </div>

            <p className="text-xs text-slate-600">
              Changes apply the next time the AI Assistant forecast tab loads.
            </p>
          </div>
        </div>

        {/* Reorder Suggestions */}
        <div className={card}>
          <h2 className="mb-4 text-sm font-semibold text-slate-200">
            Reorder Suggestions
          </h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <ResetButton
              storageKey={DISMISSED_KEY}
              label="Restore dismissed suggestions"
              emptyHint="No dismissed recommendations to restore."
            />
            <ResetButton
              storageKey={OVERRIDES_KEY}
              label="Clear quantity overrides"
              emptyHint="No quantity overrides have been saved."
            />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Brings back suggestions you dismissed and removes edited order
            quantities on the Dashboard and Forecast tabs.
          </p>
        </div>

      </div>
    </>
  );
}
