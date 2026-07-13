"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertNotification } from "./AlertNotification";
import { fetchInventoryAlerts, summarizeAlerts } from "@/lib/alerts";
import { getUser, normalizeRole } from "@/lib/auth";
import type { InventoryAlert } from "@/types/index";

// Action label shown per alert type (only rendered for privileged roles).
const ACTION_LABEL: Record<InventoryAlert["type"], string> = {
  stockout: "Order Now",
  expiry: "Mark for Use",
};

/**
 * Manager-facing alerts panel. Pulls live inventory, derives stockout/expiry
 * alerts client-side, and renders them. Action buttons are RBAC-gated: only
 * Admin / Manager roles can act on an alert — Employees get a read-only view.
 */
export function AlertsPanel() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canAct, setCanAct] = useState(false);

  useEffect(() => {
    const role = normalizeRole(getUser()?.role);
    setCanAct(role === "Admin" || role === "Manager");

    fetchInventoryAlerts()
      .then(setAlerts)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load alerts"),
      )
      .finally(() => setLoading(false));
  }, []);

  function handleAction(alert: InventoryAlert) {
    // Route stockout risks to the sourcing flow; expiry handled there too for now.
    router.push(`/sourcing?item=${alert.item_id}`);
  }

  const summary = summarizeAlerts(alerts);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-800/70 bg-slate-900/40 py-10 text-xs text-slate-500">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
        Evaluating stock alerts…
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400">
        {error}
      </div>
    );
  }

  // ── Empty (all clear) ────────────────────────────────────────────────────
  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-emerald-500/[0.02] p-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
            All Clear
          </span>
        </div>
        <p className="text-sm text-slate-400">No stockout or expiry risks right now.</p>
      </div>
    );
  }

  // ── Alert list ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 px-1 text-xs text-slate-500">
        <span className="font-medium text-slate-400">{summary.total} active</span>
        {summary.critical > 0 && (
          <span className="rounded-full border border-red-500/25 bg-red-500/10 px-1.5 py-0.5 font-medium text-red-300">
            {summary.critical} critical
          </span>
        )}
        {summary.warning > 0 && (
          <span className="rounded-full border border-orange-500/25 bg-orange-500/10 px-1.5 py-0.5 font-medium text-orange-300">
            {summary.warning} warning
          </span>
        )}
      </div>

      {/* ponytail: ~40rem ≈ 5 alert cards; tune if card layout changes */}
      <div
        className={`flex flex-col gap-4 ${
          alerts.length > 5 ? "max-h-[40rem] overflow-y-auto pr-1" : ""
        }`}
      >
        {alerts.map((alert) => (
          <AlertNotification
            key={`${alert.type}-${alert.item_id}`}
            alert={alert}
            actionLabel={canAct ? ACTION_LABEL[alert.type] : undefined}
            onAction={canAct ? handleAction : undefined}
          />
        ))}
      </div>
    </div>
  );
}
