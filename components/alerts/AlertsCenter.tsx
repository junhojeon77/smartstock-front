"use client";

import { AlertsPanel } from "@/components/alerts/AlertsPanel";

/**
 * The one Alerts Center. Self-fetching (via AlertsPanel) so every page that
 * renders it shows identical alert data — drop it into any layout column.
 */
export function AlertsCenter({ className }: { className?: string }) {
  return (
    <aside className={`flex flex-col gap-4 ${className ?? ""}`}>
      <h2 className="px-1 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Alerts Center
      </h2>
      <AlertsPanel />
    </aside>
  );
}
