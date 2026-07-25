"use client";

import { useEffect, useState } from "react";
import { WasteTrendChart } from "@/components/charts/WasteTrendChart";
import { LogWasteForm } from "@/components/waste/LogWasteForm";
import { apiFetch } from "@/lib/api";
import { bucketWasteByMonth, fetchWasteLog, summarizeWaste } from "@/lib/waste";
import type { InventoryItem, WasteEntry } from "@/types/index";

const card = "rounded-xl border border-slate-800/70 bg-slate-900/40 backdrop-blur-sm p-5";

const RECENT_LIMIT = 20;

/** Backend sends RFC 1123 timestamps (Flask jsonify), so parse before display. */
function formatDate(timestamp: string): string {
  const d = new Date(timestamp);
  return Number.isNaN(d.getTime()) ? timestamp : d.toLocaleDateString();
}

/**
 * Historical Trends tab — waste analytics. Real data from GET /api/waste:
 * summary tiles, monthly trend chart, a log-waste form, and the recent log.
 */
export function HistoricalTrendsTab() {
  const [entries, setEntries] = useState<WasteEntry[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const [waste, inventory] = await Promise.all([
        fetchWasteLog(),
        apiFetch<InventoryItem[]>("/api/inventory"),
      ]);
      setEntries(waste);
      setItems(inventory);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load waste data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = summarizeWaste(entries);

  const tiles = [
    { label: "Total Wasted", value: summary.totalQuantity.toLocaleString() },
    { label: "Log Entries", value: summary.entryCount.toLocaleString() },
    { label: "Most Wasted Item", value: summary.topItem ?? "—" },
    { label: "Top Reason", value: summary.topReason ?? "—" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900/30 py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-800 border-t-cyan-400" />
        <span className="text-sm text-slate-500">Loading waste history…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className={card}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {t.label}
            </p>
            <p className="mt-1.5 truncate text-xl font-semibold text-slate-100" title={t.value}>
              {t.value}
            </p>
          </div>
        ))}
      </div>

      {/* Monthly trend */}
      <div className={card}>
        <h2 className="mb-4 text-sm font-semibold text-slate-200">Waste Trend</h2>
        <WasteTrendChart data={bucketWasteByMonth(entries)} />
      </div>

      {/* Log waste */}
      <div className={card}>
        <h2 className="mb-4 text-sm font-semibold text-slate-200">Log Waste</h2>
        <LogWasteForm items={items} onLogged={load} />
      </div>

      {/* Recent log */}
      <div className={card}>
        <h2 className="mb-4 text-sm font-semibold text-slate-200">
          Recent Waste Log
        </h2>
        {entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-600">
            No waste logged yet.
          </p>
        ) : (
          <div className="max-h-80 overflow-x-auto overflow-y-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="sticky top-0 z-10 bg-slate-900">
                <tr className="border-b border-slate-800/60 text-xs text-slate-600">
                  <th className="pb-2.5 text-left font-medium">Date</th>
                  <th className="pb-2.5 text-left font-medium">Item</th>
                  <th className="pb-2.5 text-right font-medium">Qty</th>
                  <th className="pb-2.5 text-left font-medium pl-6">Reason</th>
                  <th className="pb-2.5 text-left font-medium">Logged By</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, RECENT_LIMIT).map((e) => (
                  <tr
                    key={e.log_id}
                    className="border-b border-slate-800/40 last:border-0"
                  >
                    <td className="py-3 tabular-nums text-slate-400">
                      {formatDate(e.timestamp)}
                    </td>
                    <td className="py-3 text-slate-300">{e.item_name}</td>
                    <td className="py-3 text-right tabular-nums text-amber-400">
                      {e.quantity}
                    </td>
                    <td className="py-3 pl-6 text-slate-400">{e.reason}</td>
                    <td className="py-3 text-slate-500">{e.logged_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
