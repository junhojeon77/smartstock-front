"use client";

import { useEffect, useRef, useState } from "react";
import { fetchInventoryAlerts, summarizeAlerts } from "@/lib/alerts";
import type { InventoryAlert } from "@/types/index";

const SEVERITY_DOT: Record<InventoryAlert["severity"], string> = {
  critical: "bg-red-400",
  warning: "bg-orange-400",
};

const TYPE_LABEL: Record<InventoryAlert["type"], string> = {
  stockout: "Stockout",
  expiry: "Expiry",
};

/**
 * Header notification bell. Fetches the live alert feed, shows an unread-style
 * count badge, and reveals a popout list on click (closes on outside-click /
 * Escape). Read-only — actions live on the dashboard AlertsPanel.
 */
export function NotificationBell() {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetchInventoryAlerts()
      .then((a) => active && setAlerts(a))
      .catch(() => active && setAlerts([])) // stay quiet in the header
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const summary = summarizeAlerts(alerts);
  const count = summary.total;
  const badgeColor = summary.critical > 0 ? "bg-red-500" : "bg-amber-500";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${count > 0 ? ` (${count})` : ""}`}
        aria-expanded={open}
        className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/30"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {count > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${badgeColor} ring-2 ring-slate-950`}
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-700/70 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/40 z-30 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800/70 px-4 py-3">
            <span className="text-sm font-semibold text-slate-100">Notifications</span>
            {count > 0 && (
              <span className="text-xs text-slate-500">
                {summary.critical > 0 && (
                  <span className="text-red-400">{summary.critical} critical</span>
                )}
                {summary.critical > 0 && summary.warning > 0 && " · "}
                {summary.warning > 0 && (
                  <span className="text-orange-400">{summary.warning} warning</span>
                )}
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
                Loading…
              </div>
            ) : alerts.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="mb-1 text-sm text-slate-300">You&apos;re all caught up</div>
                <div className="text-xs text-slate-600">No stockout or expiry risks.</div>
              </div>
            ) : (
              <ul className="divide-y divide-slate-800/60">
                {alerts.map((alert) => (
                  <li
                    key={`${alert.type}-${alert.item_id}`}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-800/30 transition-colors"
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[alert.severity]}`} />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 leading-snug">{alert.message}</p>
                      <span className="text-[11px] uppercase tracking-wide text-slate-500">
                        {TYPE_LABEL[alert.type]} · {alert.severity}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
