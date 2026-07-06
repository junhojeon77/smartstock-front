"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { PriceComparison } from "@/components/sourcing/PriceComparison";
import { apiFetch } from "@/lib/api";
import { fetchInventoryAlerts, summarizeAlerts } from "@/lib/alerts";
import {
  getItemStatus,
  STATUS_STYLES,
  type ItemStatus,
} from "@/lib/inventory";
import type { InventoryAlert, InventoryItem } from "@/types/index";

const STATUS_ORDER: ItemStatus[] = [
  "Out of Stock",
  "Expired",
  "Low Stock",
  "Expiring Soon",
  "Healthy",
];

/**
 * Reports page — live roll-ups built entirely from existing backend data:
 * inventory status breakdown (GET /api/inventory), alert summary
 * (GET /api/inventory/alerts + client expiry rules), and the supplier price
 * comparison (GET /api/inventory/<id>/prices).
 */
export default function ReportsPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<InventoryItem[]>("/api/inventory"),
      fetchInventoryAlerts(),
    ])
      .then(([inv, al]) => {
        setItems(inv);
        setAlerts(al);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load report data");
      })
      .finally(() => setLoading(false));
  }, []);

  const statuses = items.map((i) => getItemStatus(i));
  const breakdown = STATUS_ORDER.map((status) => ({
    status,
    count: statuses.filter((s) => s === status).length,
  }));
  const summary = summarizeAlerts(alerts);

  return (
    <>
      <Topbar title="Reports" />
      <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-8 pt-6 flex flex-col gap-4 lg:gap-6">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Inventory status breakdown */}
          <div className="rounded-xl border border-slate-800/70 bg-slate-900/40 backdrop-blur-sm p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-200">
              Inventory Status Breakdown
            </h2>
            {loading ? (
              <p className="py-6 text-center text-xs text-slate-600">Loading…</p>
            ) : (
              <dl className="flex flex-col divide-y divide-slate-800/60">
                {breakdown.map(({ status, count }) => (
                  <div key={status} className="flex items-center justify-between py-2.5">
                    <dt>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
                      >
                        {status}
                      </span>
                    </dt>
                    <dd className="text-sm font-semibold tabular-nums text-slate-100">
                      {count}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* Alert summary */}
          <div className="rounded-xl border border-slate-800/70 bg-slate-900/40 backdrop-blur-sm p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-200">Alert Summary</h2>
            {loading ? (
              <p className="py-6 text-center text-xs text-slate-600">Loading…</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-800/70 bg-slate-900/40 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-100">
                    {summary.total}
                  </p>
                </div>
                <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Critical</p>
                  <p className="mt-1 text-2xl font-semibold text-red-400">
                    {summary.critical}
                  </p>
                </div>
                <div className="rounded-lg border border-orange-500/20 bg-orange-500/[0.06] p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Warning</p>
                  <p className="mt-1 text-2xl font-semibold text-orange-400">
                    {summary.warning}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Supplier savings — reuses the live price comparison */}
        {!loading && !error && <PriceComparison items={items} />}
      </div>
    </>
  );
}
