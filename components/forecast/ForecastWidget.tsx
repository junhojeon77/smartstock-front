"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { fetchForecast, confidenceLabel } from "@/lib/forecast";
import { Card } from "@/components/ui/Card";
import type { ForecastResponse, InventoryItem } from "@/types/index";

const confidenceStyles: Record<string, string> = {
  High: "text-emerald-400 bg-emerald-500/10",
  Medium: "text-amber-400 bg-amber-500/10",
  Low: "text-red-400 bg-red-500/10",
};

/** An item paired with its forecast, or flagged as having no sales history. */
type ItemForecast = {
  item: InventoryItem;
  forecast?: ForecastResponse;
  noHistory?: boolean;
};

type Props = {
  /** Items to forecast. Self-fetches GET /api/inventory when omitted. */
  items?: InventoryItem[];
  /** Reports the fetched forecasts keyed by item_id (null = no history). */
  onForecasts?: (map: Record<number, ForecastResponse | null>) => void;
  /** Optional settings control(s) rendered in the card header. */
  settings?: React.ReactNode;
  /**
   * Scales the displayed demand from the model's 7-day horizon to the user's
   * restock cycle (e.g. 0.5 for twice a week, ~4.3 for monthly).
   */
  scale?: number;
  /**
   * The restock cycle in days that `scale` represents. Used only to label the
   * demand column so the number's period is explicit.
   */
  periodDays?: number;
};

/**
 * Demand forecast table. On open it forecasts every inventory item (POST
 * /api/forecast) and lists the predictions with a confidence badge. Items with
 * no stored sales history return a 404 and are shown as unavailable.
 */
export function ForecastWidget({
  items: itemsProp,
  onForecasts,
  settings,
  scale = 1,
  periodDays = 7,
}: Props = {}) {
  const [rows, setRows] = useState<ItemForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const periodLabel = periodDays === 1 ? "1 day" : `${periodDays} days`;

  // Local filter over already-fetched forecasts — no extra requests.
  const query = search.trim().toLowerCase();
  const visibleRows = query
    ? rows.filter(
        (r) =>
          r.item.item_name.toLowerCase().includes(query) ||
          (r.item.category ?? "").toLowerCase().includes(query),
      )
    : rows;

  // Forecasts depend only on which items exist (the model reads sales
  // history), so refetch only when the id set changes — not when a threshold
  // sync or settings change hands us a new array of the same items.
  const idsKey = itemsProp?.map((i) => i.item_id).join(",") ?? "self-fetch";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const items =
          itemsProp ?? (await apiFetch<InventoryItem[]>("/api/inventory"));
        // ponytail: one request per item, same as the price table. Fine for a
        // small inventory; add a batch forecast endpoint if it grows large.
        const settled = await Promise.all(
          items.map(async (item): Promise<ItemForecast> => {
            try {
              return { item, forecast: await fetchForecast(item.item_id) };
            } catch (e) {
              const msg = e instanceof Error ? e.message : "";
              // A 404 just means the item has no sales history to forecast.
              if (/404|no historical data/i.test(msg)) {
                return { item, noHistory: true };
              }
              throw e;
            }
          }),
        );
        if (!cancelled) {
          setRows(settled);
          onForecasts?.(
            Object.fromEntries(
              settled.map((r) => [r.item.item_id, r.forecast ?? null]),
            ),
          );
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Forecast failed.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // onForecasts must be referentially stable (a setState or useCallback).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, onForecasts]);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            Demand Forecast
          </h2>
          <p className="text-sm text-slate-500">
            Each item&apos;s expected demand, learned from its own sales
            history and sized to your restock cycle — this sets its minimum
            stock level automatically.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {settings}
          <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-400">
            AI
          </span>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {loading && (
        <p className="mt-4 text-sm text-slate-500">Generating forecasts…</p>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">No inventory items found.</p>
      )}

      {!loading && rows.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[10rem] flex-1">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by item or category…"
              aria-label="Search forecasts by item name or category"
              className="w-full rounded-md border border-slate-700/60 bg-slate-800/60 py-1.5 pl-8 pr-8 text-xs text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear forecast search"
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
      )}

      {!loading && rows.length > 0 && visibleRows.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          No forecasts match your search.
        </p>
      )}

      {!loading && visibleRows.length > 0 && (
        <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border border-slate-800/70">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm">
              <tr className="border-b border-slate-800/70 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5 font-medium">Item</th>
                <th className="px-4 py-2.5 text-right font-medium">
                  Predicted demand ({periodLabel})
                </th>
                <th className="px-4 py-2.5 text-right font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(({ item, forecast, noHistory }) => {
                const label = forecast
                  ? confidenceLabel(forecast.confidence_level)
                  : "";
                const pct = forecast
                  ? Math.round(forecast.confidence_level * 100)
                  : 0;
                return (
                  <tr
                    key={item.item_id}
                    className="border-b border-slate-800/40 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {item.item_name}
                    </td>
                    {forecast ? (
                      <>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold text-cyan-400">
                          {Math.round(forecast.predicted_demand * scale * 100) / 100}
                          <span className="ml-1 text-xs font-normal text-slate-500">
                            units
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            title={`The model reproduced ${item.item_name}'s past sales with ~${pct}% accuracy — its 7-day prediction inherits that reliability.`}
                            className={`cursor-help rounded-full px-2 py-0.5 text-xs font-medium ${confidenceStyles[label]}`}
                          >
                            {label} · {pct}%
                          </span>
                        </td>
                      </>
                    ) : (
                      <td
                        className="px-4 py-3 text-right text-xs text-slate-500"
                        colSpan={2}
                      >
                        {noHistory ? "No sales history" : "Unavailable"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
