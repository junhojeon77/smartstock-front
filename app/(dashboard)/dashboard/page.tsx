"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { WasteTrendChart } from "@/components/charts/WasteTrendChart";
import { AlertsPanel } from "@/components/alerts/AlertsPanel";
import { apiFetch } from "@/lib/api";
import { EXPIRY_WARNING_DAYS } from "@/lib/alerts";
import type { InventoryItem } from "@/types/index";

// ─── Static mock data (non-inventory widgets) ────────────────────────────────

const procurement = [
  { item: "Canned Tomatoes", suggested: "5 Boxes" },
  { item: "Olive Oil", suggested: "2 Gallons" },
  { item: "Pasta", suggested: "10 Lbs" },
];

const orderHistory = [
  { item: "Canned Tomatoes", status: "Delivered" },
  { item: "Olive Oil", status: "Delivered" },
  { item: "Fresh Tomatoes", status: "Pending" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ItemStatus =
  | "Out of Stock"
  | "Expired"
  | "Low Stock"
  | "Expiring Soon"
  | "Healthy";

// Single status per item, by priority (worst first). Mirrors the alert rules in
// lib/alerts.ts so the dashboard, AlertsPanel, and notification bell agree.
function getItemStatus(item: InventoryItem, now: Date = new Date()): ItemStatus {
  const quantity = Number(item.quantity) || 0;
  const threshold = Number(item.minimum_threshold ?? 0) || 0;

  if (quantity <= 0) return "Out of Stock";

  const exp = item.expiry_date ? new Date(item.expiry_date) : null;
  const expValid = exp != null && !Number.isNaN(exp.getTime());
  const days = expValid
    ? Math.floor((exp!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    : null;

  if (days != null && days < 0) return "Expired";
  if (quantity <= threshold) return "Low Stock";
  if (days != null && days <= EXPIRY_WARNING_DAYS) return "Expiring Soon";
  return "Healthy";
}

const STATUS_STYLES: Record<ItemStatus, string> = {
  "Out of Stock":  "bg-red-500/10    text-red-400     border-red-500/20",
  "Expired":       "bg-rose-500/10   text-rose-400    border-rose-500/20",
  "Low Stock":     "bg-orange-500/10 text-orange-400  border-orange-500/20",
  "Expiring Soon": "bg-amber-500/10  text-amber-400   border-amber-500/20",
  "Healthy":       "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<InventoryItem[]>("/api/inventory")
      .then(setItems)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load inventory");
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Derived inventory KPIs ──────────────────────────────────────────────────

  const statuses = items.map((i) => getItemStatus(i));
  const totalItems     = items.length;
  const lowStockCount  = statuses.filter((s) => s === "Out of Stock" || s === "Low Stock").length;
  const expiringSoonCount = statuses.filter((s) => s === "Expiring Soon").length;
  const expiredCount   = statuses.filter((s) => s === "Expired").length;
  const healthyCount   = statuses.filter((s) => s === "Healthy").length;
  const healthPct = totalItems === 0 ? 100 : Math.round((healthyCount / totalItems) * 100);

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

          {/* Monthly Waste Trend — mock */}
          <div className="rounded-xl border border-slate-800/70 bg-slate-900/40 backdrop-blur-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-200">Monthly Waste Trend</h2>
              <span className="rounded-full border border-slate-700/60 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-500">
                Avg 281 Lbs
              </span>
            </div>
            <WasteTrendChart />
          </div>

          {/* Bottom two-column section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AI Procurement Recommendations — mock */}
            <div className="rounded-xl border border-slate-800/70 bg-slate-900/40 backdrop-blur-sm p-5">
              <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                AI Procurement Recommendations
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-600 border-b border-slate-800/60">
                    <th className="pb-2.5 text-left font-medium">Item</th>
                    <th className="pb-2.5 text-right font-medium">Suggested</th>
                  </tr>
                </thead>
                <tbody>
                  {procurement.map((row) => (
                    <tr key={row.item} className="border-b border-slate-800/40 last:border-0">
                      <td className="py-3 text-slate-300 text-sm">{row.item}</td>
                      <td className="py-3 text-right">
                        <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-400">
                          {row.suggested}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Inventory Status — LIVE */}
            <div className="rounded-xl border border-slate-800/70 bg-slate-900/40 backdrop-blur-sm p-5">
              <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Inventory Status
              </h2>
              <table className="w-full text-sm">
                <thead>
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
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-sm text-slate-600">
                        No inventory items found.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
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

        {/* ── Alerts sidebar ── */}
        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1 pt-1">
            Alerts Center
          </h2>

          {/* Live stockout / expiry alerts — derived from inventory */}
          <AlertsPanel />

          {/* Order history */}
          <div className="rounded-xl border border-slate-800/70 bg-slate-900/40 backdrop-blur-sm p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Recent Orders
            </h3>
            <ul className="flex flex-col gap-2.5">
              {orderHistory.map((o) => (
                <li
                  key={o.item}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-sm text-slate-300 truncate">{o.item}</span>
                  <span
                    className={
                      o.status === "Pending"
                        ? "shrink-0 rounded-full bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-400"
                        : "shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400"
                    }
                  >
                    {o.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
