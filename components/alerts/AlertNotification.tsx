import type { InventoryAlert } from "@/types/index";

// ─── Severity-driven styling ──────────────────────────────────────────────────

const SEVERITY_STYLES: Record<
  InventoryAlert["severity"],
  { container: string; dot: string; label: string; action: string }
> = {
  critical: {
    container: "border-red-500/25 bg-gradient-to-br from-red-500/10 to-red-500/[0.03]",
    dot: "bg-red-400 animate-pulse",
    label: "text-red-300",
    action: "bg-red-500 text-white hover:bg-red-400 shadow-red-500/20",
  },
  warning: {
    container: "border-orange-500/25 bg-gradient-to-br from-orange-500/10 to-orange-500/[0.03]",
    dot: "bg-orange-400 animate-pulse",
    label: "text-orange-300",
    action: "bg-orange-500 text-white hover:bg-orange-400 shadow-orange-500/20",
  },
};

const TYPE_LABEL: Record<InventoryAlert["type"], string> = {
  stockout: "Stockout Risk",
  expiry: "Expiry Risk",
};

// ─── Component ────────────────────────────────────────────────────────────────

type AlertNotificationProps = {
  alert: InventoryAlert;
  /** Label for the call-to-action button. When omitted (or onAction missing), no button renders. */
  actionLabel?: string;
  /** Invoked when the action button is pressed. Gate this on role for RBAC. */
  onAction?: (alert: InventoryAlert) => void;
};

/**
 * Presentational alert card for the manager UI. Stateless — colour, label, and
 * the optional action button are all derived from the alert + props, so it can
 * be reused anywhere (dashboard sidebar, reports, etc.).
 */
export function AlertNotification({
  alert,
  actionLabel,
  onAction,
}: AlertNotificationProps) {
  const styles = SEVERITY_STYLES[alert.severity];
  const showAction = Boolean(actionLabel && onAction);

  return (
    <div
      role="alert"
      className={`rounded-xl border ${styles.container} p-5`}
      data-severity={alert.severity}
      data-type={alert.type}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
        <span className={`text-xs font-semibold uppercase tracking-wide ${styles.label}`}>
          {TYPE_LABEL[alert.type]}
        </span>
        {alert.severity === "critical" && (
          <span className="ml-auto rounded-full border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-300">
            Critical
          </span>
        )}
      </div>

      <p className="text-sm text-slate-300 mb-4 leading-relaxed">{alert.message}</p>

      {showAction && (
        <button
          type="button"
          onClick={() => onAction?.(alert)}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors shadow-sm ${styles.action}`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
