"use client";

import { useState } from "react";
import { ForecastWidget } from "@/components/forecast/ForecastWidget";
import { WasteTrendChart } from "@/components/charts/WasteTrendChart";
import { Button } from "@/components/ui/Button";
import {
  getItemStatus,
  suggestReorders,
  STATUS_STYLES,
} from "@/lib/inventory";
import type { InventoryItem } from "@/types/index";

type Props = {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
};

function cardClass() {
  return "rounded-xl border border-slate-800/70 bg-slate-900/40 backdrop-blur-sm p-5";
}

/**
 * Inventory & Forecasting AI tab. Combines the interactive demand forecast
 * (backend /api/forecast) with live inventory aggregates, AI-derived reorder
 * recommendations, and a status table. Approve / Create PO are template
 * actions that record local acknowledgement only.
 */
export function InventoryForecastTab({ items, loading, error }: Props) {
  const [approved, setApproved] = useState<Set<number>>(new Set());
  const [ordered, setOrdered] = useState<Set<number>>(new Set());

  const totalUnits = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const statuses = items.map((i) => getItemStatus(i));
  const lowStock = statuses.filter(
    (s) => s === "Low Stock" || s === "Out of Stock",
  ).length;
  const expiring = statuses.filter((s) => s === "Expiring Soon").length;
  const healthy = statuses.filter((s) => s === "Healthy").length;
  const healthPct = items.length === 0 ? 100 : Math.round((healthy / items.length) * 100);

  const reorders = suggestReorders(items);

  const summaryRows: [string, string][] = [
    ["Total stock items", loading ? "—" : String(items.length)],
    ["Total units on hand", loading ? "—" : totalUnits.toLocaleString()],
    ["Low / out of stock", loading ? "—" : String(lowStock)],
    ["Expiring soon", loading ? "—" : String(expiring)],
    ["Inventory health", loading ? "—" : `${healthPct}%`],
  ];

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Interactive demand forecast (backend /api/forecast) */}
      <ForecastWidget />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Current inventory status (live aggregates) */}
        <div className={cardClass()}>
          <h2 className="mb-4 text-sm font-semibold text-slate-200">
            Current Inventory Status
          </h2>
          <dl className="flex flex-col divide-y divide-slate-800/60">
            {summaryRows.map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between py-2.5"
              >
                <dt className="text-sm text-slate-400">{label}</dt>
                <dd className="text-sm font-semibold tabular-nums text-slate-100">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Demand trend chart */}
        <div className={cardClass()}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Demand Trend</h2>
            <span className="rounded-full border border-slate-700/60 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-500">
              12-month
            </span>
          </div>
          <WasteTrendChart />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* AI procurement recommendations (live) */}
        <div className={cardClass()}>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            AI Procurement Recommendations
          </h2>
          {reorders.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-600">
              {loading ? "Loading…" : "No reorders needed — stock looks healthy."}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/60 text-xs text-slate-600">
                  <th className="pb-2.5 text-left font-medium">Item</th>
                  <th className="pb-2.5 text-right font-medium">Qty</th>
                  <th className="pb-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {reorders.map(({ item, suggestedQty }) => (
                  <tr
                    key={item.item_id}
                    className="border-b border-slate-800/40 last:border-0"
                  >
                    <td className="py-3 text-slate-300">{item.item_name}</td>
                    <td className="py-3 text-right tabular-nums text-slate-400">
                      {suggestedQty}
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        variant={approved.has(item.item_id) ? "secondary" : "primary"}
                        className="px-2.5 py-1 text-xs"
                        disabled={approved.has(item.item_id)}
                        onClick={() =>
                          setApproved((prev) =>
                            new Set(prev).add(item.item_id),
                          )
                        }
                      >
                        {approved.has(item.item_id) ? "Approved ✓" : "Approve"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Inventory status table (live) with Create PO */}
        <div className={cardClass()}>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Inventory Status
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60 text-xs text-slate-600">
                <th className="pb-2.5 text-left font-medium">Item</th>
                <th className="pb-2.5 text-left font-medium">Status</th>
                <th className="pb-2.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-xs text-slate-600">
                    Loading…
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
                    <tr
                      key={item.item_id}
                      className="border-b border-slate-800/40 last:border-0"
                    >
                      <td className="py-3 font-medium text-slate-200">
                        {item.item_name}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          className="px-2.5 py-1 text-xs"
                          disabled={ordered.has(item.item_id)}
                          onClick={() =>
                            setOrdered((prev) =>
                              new Set(prev).add(item.item_id),
                            )
                          }
                        >
                          {ordered.has(item.item_id) ? "PO Created" : "Create PO"}
                        </Button>
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
  );
}
