"use client";

import { useEffect, useState } from "react";
import { fetchInventoryAlerts } from "@/lib/alerts";
import { Button } from "@/components/ui/Button";
import type { InventoryAlert } from "@/types/index";

const RECENT_ORDERS = [
  { item: "Canned Tomatoes", status: "Delivered" },
  { item: "Olive Oil", status: "Delivered" },
  { item: "Fresh Tomatoes", status: "Pending" },
  { item: "Box Canned Tomatoes", status: "Delivered" },
];

/**
 * Alerts Center right rail for the AI Assistant. Surfaces the top stockout risk
 * and expiry alert from the live inventory (via fetchInventoryAlerts) plus a
 * recent-orders list (template data). Action buttons are template no-ops.
 */
export function AlertsCenter() {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);

  useEffect(() => {
    fetchInventoryAlerts()
      .then(setAlerts)
      .catch(() => setAlerts([]));
  }, []);

  const stockout = alerts.find((a) => a.type === "stockout");
  const expiry = alerts.find((a) => a.type === "expiry");

  return (
    <aside className="flex flex-col gap-4">
      <h2 className="px-1 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Alerts Center
      </h2>

      {/* Stockout risk warning */}
      {stockout ? (
        <div className="rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/[0.12] to-orange-500/[0.03] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-orange-400">
            <span className="h-2 w-2 rounded-full bg-orange-400" />
            Stockout Risk Warning
          </div>
          <p className="mt-2 text-sm text-slate-200">{stockout.message}</p>
          <Button className="mt-3" variant="secondary">
            Order Now
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 text-sm text-emerald-400">
          No stockout risks detected.
        </div>
      )}

      {/* Expiring today / soon */}
      <div className="rounded-xl border border-slate-800/70 bg-slate-900/40 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Expiring Soon
        </h3>
        {expiry ? (
          <div className="mt-2">
            <p className="text-sm text-slate-200">{expiry.item_name}</p>
            <p className="text-xs text-slate-500">{expiry.message}</p>
            <Button className="mt-2" variant="secondary">
              Mark for Use
            </Button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Nothing expiring soon.</p>
        )}
      </div>

      {/* Recent order history */}
      <div className="rounded-xl border border-slate-800/70 bg-slate-900/40 p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Recent Order History
        </h3>
        <ul className="flex flex-col gap-2.5">
          {RECENT_ORDERS.map((o) => (
            <li key={o.item} className="flex items-center justify-between gap-2">
              <span className="truncate text-sm text-slate-300">{o.item}</span>
              <span
                className={
                  o.status === "Pending"
                    ? "shrink-0 rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-400"
                    : "shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400"
                }
              >
                {o.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
