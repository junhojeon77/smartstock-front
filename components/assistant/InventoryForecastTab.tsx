"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ForecastWidget } from "@/components/forecast/ForecastWidget";
import { ReorderSuggestions } from "@/components/inventory/ReorderSuggestions";
import { getItemStatus, STATUS_STYLES } from "@/lib/inventory";
import { configureThreshold } from "@/lib/alerts";
import { getUser, normalizeRole } from "@/lib/auth";
import type { ForecastResponse, InventoryItem } from "@/types/index";

type Props = {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
  /** Re-fetch inventory (called after thresholds are written). */
  onRefresh?: () => void;
};

// Exported so the Settings page can offer the same controls over shared state.
export const RESTOCK_KEY = "smartstock_restock_days";
export const AUTOSYNC_KEY = "smartstock_autosync";
/** How often the user restocks; min required = 7-day forecast × days/7. */
export const RESTOCK_CYCLES = [
  { label: "Daily", days: 1 },
  { label: "Twice a week", days: 3.5 },
  { label: "Weekly", days: 7 },
  { label: "Every two weeks", days: 14 },
  { label: "Monthly", days: 30 },
] as const;
export const DEFAULT_RESTOCK_DAYS = 7;

type SortKey = "name" | "qty" | "expiry" | "min";

function cardClass() {
  return "rounded-xl border border-slate-800/70 bg-slate-900/40 backdrop-blur-sm p-5";
}

function formatExpiry(item: InventoryItem): string {
  if (!item.expiry_date) return "—";
  const d = new Date(item.expiry_date);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function expiryMs(item: InventoryItem): number {
  if (!item.expiry_date) return Infinity; // no expiry sorts last
  const t = new Date(item.expiry_date).getTime();
  return Number.isNaN(t) ? Infinity : t;
}

/**
 * Demand Forecasting tab. The demand forecast (backend /api/forecast)
 * doubles as each item's minimum quantity required: the inventory table below
 * derives status from ceil(predicted_demand) when the forecast clears the
 * user's confidence floor, and "Apply forecast as minimums" persists those
 * values via the existing threshold endpoint so the whole app follows.
 */
export function InventoryForecastTab({ items, loading, error, onRefresh }: Props) {
  const [forecasts, setForecasts] = useState<Record<
    number,
    ForecastResponse | null
  > | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [restockDays, setRestockDays] = useState<number>(DEFAULT_RESTOCK_DAYS);
  const [autoSync, setAutoSync] = useState(true);
  const [applyMsg, setApplyMsg] = useState<string | null>(null);
  const [statusSearch, setStatusSearch] = useState("");
  const syncing = useRef(false);

  useEffect(() => {
    const days = Number(localStorage.getItem(RESTOCK_KEY));
    if (RESTOCK_CYCLES.some((c) => c.days === days)) setRestockDays(days);
    if (localStorage.getItem(AUTOSYNC_KEY) === "off") setAutoSync(false);
  }, []);

  const setCycle = (days: number) => {
    setRestockDays(days);
    localStorage.setItem(RESTOCK_KEY, String(days));
  };

  const toggleAutoSync = () => {
    setAutoSync((on) => {
      const next = !on;
      localStorage.setItem(AUTOSYNC_KEY, next ? "on" : "off");
      if (!next) setApplyMsg(null);
      return next;
    });
  };

  const canManage = ["Admin", "Manager"].includes(
    normalizeRole(getUser()?.role) ?? "",
  );

  /**
   * Forecast-derived minimum for an item, or null when there's no forecast.
   * The 7-day forecast is scaled to the restock cycle: enough stock to last
   * until the next shopping trip.
   */
  const forecastMin = (item: InventoryItem): number | null => {
    const f = forecasts?.[item.item_id];
    if (!f) return null;
    return Math.ceil((f.predicted_demand * restockDays) / 7);
  };

  const rows = useMemo(() => {
    const enriched = items.map((item) => {
      const fMin = autoSync ? forecastMin(item) : null;
      const storedMin = Number(item.minimum_threshold ?? 0) || 0;
      const min = fMin ?? storedMin;
      return {
        item,
        min,
        fromForecast: fMin != null,
        storedMin,
        status: getItemStatus({ ...item, minimum_threshold: min }),
      };
    });
    const dir = sortAsc ? 1 : -1;
    return enriched.sort((a, b) => {
      switch (sortKey) {
        case "qty":
          return dir * ((Number(a.item.quantity) || 0) - (Number(b.item.quantity) || 0));
        case "expiry":
          return dir * (expiryMs(a.item) - expiryMs(b.item));
        case "min":
          return dir * (a.min - b.min);
        default:
          return dir * a.item.item_name.localeCompare(b.item.item_name);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, forecasts, restockDays, sortKey, sortAsc, autoSync]);

  const pendingApply = rows.filter(
    (r) => r.fromForecast && r.min !== r.storedMin,
  );

  // Display-only filter for the status table. `rows` — and therefore
  // pendingApply and the auto-sync effect below — is deliberately left
  // unfiltered so searching never changes which minimums get synced.
  const statusQuery = statusSearch.trim().toLowerCase();
  const visibleRows = statusQuery
    ? rows.filter(
        (r) =>
          r.item.item_name.toLowerCase().includes(statusQuery) ||
          (r.item.category ?? "").toLowerCase().includes(statusQuery),
      )
    : rows;

  // Auto-sync: whenever forecasts (or the settings that scale them) produce a
  // minimum that differs from the stored threshold, persist it. Idempotent —
  // after the refresh the diff is empty, so the effect settles.
  useEffect(() => {
    if (!autoSync || !canManage || syncing.current || pendingApply.length === 0)
      return;
    syncing.current = true;
    Promise.all(
      pendingApply.map((r) => configureThreshold(r.item.item_id, r.min)),
    )
      .then(() => {
        setApplyMsg(
          `Auto-updated ${pendingApply.length} minimum(s) from forecast.`,
        );
        onRefresh?.();
      })
      .catch((e: unknown) => {
        setApplyMsg(
          e instanceof Error ? e.message : "Failed to update minimums.",
        );
      })
      .finally(() => {
        syncing.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingApply.map((r) => `${r.item.item_id}:${r.min}`).join(","), autoSync]);

  const sortHeader = (key: SortKey, label: string, right = false) => (
    <th className={`px-4 py-2.5 font-medium ${right ? "text-right" : "text-left"}`}>
      <button
        onClick={() => {
          if (sortKey === key) setSortAsc(!sortAsc);
          else {
            setSortKey(key);
            setSortAsc(true);
          }
        }}
        className="inline-flex items-center gap-1 uppercase tracking-wide transition-colors hover:text-slate-300"
      >
        {label}
        {sortKey === key && <span>{sortAsc ? "▲" : "▼"}</span>}
      </button>
    </th>
  );

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Interactive demand forecast (backend /api/forecast) */}
      <ForecastWidget
        items={items}
        onForecasts={setForecasts}
        scale={restockDays / 7}
        periodDays={restockDays}
        settings={
          <label className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Restock
            </span>
            <select
              value={restockDays}
              onChange={(e) => setCycle(Number(e.target.value))}
              className="rounded-md border border-slate-700/60 bg-slate-800/60 px-2 py-1.5 text-sm text-slate-200 focus:border-cyan-500/50 focus:outline-none"
            >
              {RESTOCK_CYCLES.map((c) => (
                <option key={c.days} value={c.days}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        }
      />

      {/* Current inventory — scrollable, sortable, forecast-driven minimums */}
      <div className={cardClass()}>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-200">
            Current Inventory Status
          </h2>
          {canManage && (
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-xs ${
                  autoSync
                    ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
                    : "border-slate-700/60 bg-slate-800/60 text-slate-500"
                }`}
              >
                Minimums auto-sync with forecast
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={autoSync}
                onClick={toggleAutoSync}
                title={autoSync ? "Turn auto-sync off" : "Turn auto-sync on"}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                  autoSync ? "bg-cyan-500" : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    autoSync ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}
        </div>
        <p className="mb-3 text-xs text-slate-500">
          Min required = AI-forecasted demand scaled to your{" "}
          {RESTOCK_CYCLES.find((c) => c.days === restockDays)?.label.toLowerCase()}{" "}
          restock cycle; items without sales history use their stored minimum.
          {canManage &&
            (autoSync
              ? " These values are saved as each item's threshold automatically."
              : " Auto-sync is off — showing each item's stored minimum, unchanged by the forecast.")}
        </p>
        {applyMsg && (
          <p className="mb-3 text-xs text-emerald-400">{applyMsg}</p>
        )}

        {/* Local search over name + category */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[10rem] flex-1">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
            </span>
            <input
              type="text"
              value={statusSearch}
              onChange={(e) => setStatusSearch(e.target.value)}
              placeholder="Search by item or category…"
              aria-label="Search inventory status by item name or category"
              className="w-full rounded-md border border-slate-700/60 bg-slate-800/60 py-1.5 pl-8 pr-8 text-xs text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/20"
            />
            {statusSearch && (
              <button
                type="button"
                onClick={() => setStatusSearch("")}
                aria-label="Clear inventory status search"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 transition-colors hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <span className="shrink-0 text-[11px] tabular-nums text-slate-500">
            {visibleRows.length} of {rows.length}
          </span>
        </div>

        <div className="max-h-60 overflow-y-auto overflow-x-auto rounded-lg border border-slate-800/70">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm">
              <tr className="border-b border-slate-800/70 text-xs text-slate-500">
                {sortHeader("name", "Item")}
                {sortHeader("qty", "Qty", true)}
                {sortHeader("expiry", "Expiry", true)}
                {sortHeader("min", "Min required", true)}
                <th className="px-4 py-2.5 text-right font-medium uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-600">
                    Loading…
                  </td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-slate-600">
                    {statusQuery
                      ? `No items match "${statusSearch.trim()}".`
                      : "No inventory items found."}
                  </td>
                </tr>
              ) : (
                visibleRows.map(({ item, min, fromForecast, storedMin, status }) => (
                  <tr
                    key={item.item_id}
                    className="border-b border-slate-800/40 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {item.item_name}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-400">
                      {formatExpiry(item)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                      {min}
                      <span className="ml-1.5 text-[11px] text-slate-500">
                        {fromForecast
                          ? min !== storedMin
                            ? `forecast · stored: ${storedMin}`
                            : "forecast"
                          : "stored"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI procurement recommendations — live, explainable, overridable */}
      <ReorderSuggestions items={items} loading={loading} />
    </div>
  );
}
