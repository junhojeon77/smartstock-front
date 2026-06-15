"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { fetchForecast, confidenceLabel } from "@/lib/forecast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { ForecastResponse, InventoryItem } from "@/types/index";

const confidenceStyles: Record<string, string> = {
  High: "text-emerald-400 bg-emerald-500/10",
  Medium: "text-amber-400 bg-amber-500/10",
  Low: "text-red-400 bg-red-500/10",
};

/**
 * Demand forecast widget. Lets the user pick an inventory item, POSTs to the
 * backend /api/forecast endpoint, and displays the validated prediction. Items
 * without stored sales history return a 404 from the backend, surfaced inline.
 */
export function ForecastWidget() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<InventoryItem[]>("/api/inventory")
      .then((data) => {
        setItems(data);
        if (data.length > 0) setSelectedId(data[0].item_id);
      })
      .catch(() => setError("Could not load inventory items."));
  }, []);

  async function handleGenerate() {
    if (selectedId === "") return;
    setLoading(true);
    setError(null);
    setForecast(null);
    try {
      const result = await fetchForecast(Number(selectedId));
      setForecast(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Forecast failed.");
    } finally {
      setLoading(false);
    }
  }

  const selectedItem = items.find((i) => i.item_id === selectedId);
  const confidencePct = forecast
    ? Math.round(forecast.confidence_level * 100)
    : 0;
  const label = forecast ? confidenceLabel(forecast.confidence_level) : "";

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            Demand Forecast
          </h2>
          <p className="text-sm text-slate-500">
            Predicted demand for the next 7 days.
          </p>
        </div>
        <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-400">
          AI
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Item
          </span>
          <select
            value={selectedId}
            onChange={(e) =>
              setSelectedId(e.target.value === "" ? "" : Number(e.target.value))
            }
            disabled={items.length === 0}
            className="w-full rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
          >
            {items.length === 0 && <option value="">No items</option>}
            {items.map((item) => (
              <option key={item.item_id} value={item.item_id}>
                {item.item_name} (#{item.item_id})
              </option>
            ))}
          </select>
        </label>
        <Button
          onClick={handleGenerate}
          disabled={loading || selectedId === ""}
        >
          {loading ? "Forecasting…" : "Generate forecast"}
        </Button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {forecast && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-800/70 bg-slate-900/40 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Predicted demand
            </p>
            <p className="mt-1 text-3xl font-semibold text-cyan-400">
              {forecast.predicted_demand}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              units · {selectedItem?.item_name ?? `item #${forecast.item_id}`}
            </p>
          </div>

          <div className="rounded-lg border border-slate-800/70 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Confidence
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${confidenceStyles[label]}`}
              >
                {label}
              </span>
            </div>
            <p className="mt-1 text-3xl font-semibold text-slate-100">
              {confidencePct}%
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-cyan-500 transition-all duration-300"
                style={{ width: `${confidencePct}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
