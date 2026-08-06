"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { WasteTrendChart } from "@/components/charts/WasteTrendChart";
import { AlertsCenter } from "@/components/alerts/AlertsCenter";
import { ReorderSuggestions } from "@/components/inventory/ReorderSuggestions";
import { apiFetch } from "@/lib/api";
import { EXPIRY_WARNING_DAYS } from "@/lib/alerts";
import { bucketWasteByMonth, fetchWasteLog } from "@/lib/waste";
import type { WasteEntry } from "@/types/index";
import {
  getItemStatus,
  STATUS_STYLES,
  type ItemStatus,
} from "@/lib/inventory";
import type { InventoryItem } from "@/types/index";

function StatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [waste, setWaste] = useState<WasteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invSearch, setInvSearch] = useState("");

  useEffect(() => {
    apiFetch<InventoryItem[]>("/api/inventory")
      .then(setItems)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load inventory");
      })
      .finally(() => setLoading(false));
    // ponytail: waste trend is decorative here — a failed fetch just leaves
    // the chart in its empty state instead of raising the page error banner.
    fetchWasteLog().then(setWaste).catch(() => {});
  }, []);

  // ── Derived inventory KPIs ──────────────────────────────────────────────────

  const statuses = items.map((i) => getItemStatus(i));
  const totalItems     = items.length;
  const lowStockCount  = statuses.filter((s) => s === "Out of Stock" || s === "Low Stock").length;
  const expiringSoonCount = statuses.filter((s) => s === "Expiring Soon").length;
  const expiredCount   = statuses.filter((s) => s === "Expired").length;
  const healthyCount   = statuses.filter((s) => s === "Healthy").length;
  const healthPct = totalItems === 0 ? 100 : Math.round((healthyCount / totalItems) * 100);

  // Local search for the status table only — the KPI cards above always
  // reflect the full inventory. All data is already client-side.
  const invQuery = invSearch.trim().toLowerCase();
  const visibleItems = invQuery
    ? items.filter(
        (i) =>
          i.item_name.toLowerCase().includes(invQuery) ||
          (i.category ?? "").toLowerCase().includes(invQuery),
      )
    : items;

  const kpis = [
    {
      label:  "Total Stock Items",
      value:  loading ? "—" : String(totalItems),
      sub:    "Items in database",
      accent: "text-cyan-400",
      bg:     "from-cyan-500/[0.08] to-cyan-500/[0.02]",
      dot:    "bg-cyan-400",
      ring:   "border-cyan-500/20",
    },
    {
      label:  "Low Stock",
      value:  loading ? "—" : String(lowStockCount),
      sub:    "Below threshold",
      accent: lowStockCount > 0 ? "text-orange-400" : "text-emerald-400",
      bg:     lowStockCount > 0 ? "from-orange-500/[0.08] to-orange-500/[0.02]" : "from-emerald-500/[0.08] to-emerald-500/[0.02]",
      dot:    lowStockCount > 0 ? "bg-orange-400" : "bg-emerald-400",
      ring:   lowStockCount > 0 ? "border-orange-500/20" : "border-emerald-500/20",
    },
    {
      label:  "Inventory Health",
      value:  loading ? "—" : `${healthPct}%`,
      sub:    `${expiringSoonCount} expiring ≤${EXPIRY_WARNING_DAYS}d · ${expiredCount} expired`,
      accent: healthPct >= 80 ? "text-emerald-400" : "text-orange-400",
      bg:     healthPct >= 80 ? "from-emerald-500/[0.08] to-emerald-500/[0.02]" : "from-orange-500/[0.08] to-orange-500/[0.02]",
      dot:    healthPct >= 80 ? "bg-emerald-400" : "bg-orange-400",
      ring:   healthPct >= 80 ? "border-emerald-500/20" : "border-orange-500/20",
    },
  ];

  return (
    <>
      <Topbar title="Dashboard" />

      <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-8 pt-6 grid grid-cols-12 gap-4 lg:gap-6">

        {/* ── Main content column ── */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4 lg:gap-5">

          {/* Error banner */}
          {error && (
            <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-4 rounded p-0.5 hover:text-red-300 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Live KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            {kpis.map((k) => (
              <div
                key={k.label}
                className={`rounded-xl border ${k.ring} bg-gradient-to-br ${k.bg} backdrop-blur-sm p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {k.label}
                  </span>
                  <span className={`h-2 w-2 rounded-full ${k.dot} shadow-sm`} />
                </div>
                <div className={`text-3xl font-bold tabular-nums ${k.accent}`}>
                  {k.value}
                </div>
                <div className="text-xs text-slate-500 mt-1.5">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Monthly Waste Trend — live waste log */}
          <div className="rounded-xl border border-slate-800/70 bg-slate-900/40 backdrop-blur-sm p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-200">Monthly Waste Trend</h2>
            <WasteTrendChart data={bucketWasteByMonth(waste)} />
          </div>

          {/* Bottom two-column section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reorder Recommendations — live, explainable, overridable */}
            <ReorderSuggestions items={items} loading={loading} />

            {/* Inventory Status — LIVE */}
            <div className="rounded-xl border border-slate-800/70 bg-slate-900/40 backdrop-blur-sm p-5">
              <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Inventory Status
              </h2>

              {/* Local search over name + category */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="relative min-w-[9rem] flex-1">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M21 21l-4.3-4.3" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={invSearch}
                    onChange={(e) => setInvSearch(e.target.value)}
                    placeholder="Search by item or category…"
                    aria-label="Search inventory status by item name or category"
                    className="w-full rounded-md border border-slate-700/60 bg-slate-800/60 py-1.5 pl-8 pr-8 text-xs text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/20"
                  />
                  {invSearch && (
                    <button
                      type="button"
                      onClick={() => setInvSearch("")}
                      aria-label="Clear inventory search"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 transition-colors hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-slate-500">
                  {visibleItems.length} of {items.length}
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-slate-900">
                  <tr className="text-xs text-slate-600 border-b border-slate-800/60">
                    <th className="pb-2.5 text-left font-medium">Item</th>
                    <th className="pb-2.5 text-left font-medium">Qty</th>
                    <th className="pb-2.5 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-600 text-xs">
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
                          Loading…
                        </div>
                      </td>
                    </tr>
                  ) : visibleItems.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-sm text-slate-600">
                        {invQuery
                          ? `No items match "${invSearch.trim()}".`
                          : "No inventory items found."}
                      </td>
                    </tr>
                  ) : (
                    visibleItems.map((item) => {
                      const status = getItemStatus(item);
                      return (
                        <tr key={item.item_id} className="border-b border-slate-800/40 last:border-0">
                          <td className="py-3 text-slate-200 text-sm font-medium">{item.item_name}</td>
                          <td className="py-3 text-slate-400 text-sm tabular-nums">{item.quantity}</td>
                          <td className="py-3 text-right">
                            <StatusBadge status={status} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </div>

        {/* ── Alerts sidebar (shared component, same data on every page) ── */}
        <AlertsCenter className="col-span-12 lg:col-span-4" />
      </div>
    </>
  );
}
