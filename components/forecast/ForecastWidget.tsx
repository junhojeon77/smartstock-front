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
}: Props = {}) {
  const [rows, setRows] = useState<ItemForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <div className="mt-5 overflow-hidden rounded-lg border border-slate-800/70">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/70 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5 font-medium">Item</th>
                <th className="px-4 py-2.5 text-right font-medium">
                  Predicted demand
                </th>
                <th className="px-4 py-2.5 text-right font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ item, forecast, noHistory }) => {
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
