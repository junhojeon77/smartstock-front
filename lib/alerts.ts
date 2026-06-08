import { apiFetch } from "@/lib/api";
import type {
  InventoryItem,
  InventoryAlert,
  AlertSummary,
  StockAlertsResponse,
} from "@/types/index";

/**
 * Stockout & expiry risk evaluation.
 *
 * Stockout risk is owned by the backend (GET /api/inventory/alerts), which
 * applies the server-configured minimum thresholds. Expiry risk has no backend
 * endpoint, so it is derived client-side from the raw inventory. The pure
 * helpers below keep both rule sets trivially unit-testable, and
 * `fetchInventoryAlerts` stitches them together for the UI.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Items expiring within this many days raise a (warning) expiry alert. */
export const EXPIRY_WARNING_DAYS = 3;

const SEVERITY_RANK: Record<InventoryAlert["severity"], number> = {
  critical: 0,
  warning: 1,
};

function parseExpiry(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Sort critical-first, then alphabetically by item name. */
function sortAlerts(alerts: InventoryAlert[]): InventoryAlert[] {
  return alerts.sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      a.item_name.localeCompare(b.item_name),
  );
}

/**
 * Turn a single at-risk inventory item into a stockout alert.
 * Out-of-stock is critical; at/below threshold is a warning.
 */
export function buildStockoutAlert(item: InventoryItem): InventoryAlert {
  const name = item.item_name ?? "Unknown item";
  const quantity = Number(item.quantity) || 0;
  const threshold = Number(item.minimum_threshold ?? 0) || 0;

  if (quantity <= 0) {
    return {
      item_id: item.item_id,
      item_name: name,
      type: "stockout",
      severity: "critical",
      quantity,
      threshold,
      message: `${name} is out of stock.`,
    };
  }

  return {
    item_id: item.item_id,
    item_name: name,
    type: "stockout",
    severity: "warning",
    quantity,
    threshold,
    message: `${name} is running low — ${quantity} left (min ${threshold}).`,
  };
}

/**
 * Stockout rules (client-side fallback / pure form):
 *   - quantity <= 0             → critical (out of stock)
 *   - quantity <= threshold     → warning  (below minimum)
 */
export function evaluateStockoutAlerts(items: InventoryItem[]): InventoryAlert[] {
  const alerts: InventoryAlert[] = [];
  for (const item of items) {
    const quantity = Number(item.quantity) || 0;
    const threshold = Number(item.minimum_threshold ?? 0) || 0;
    if (quantity <= 0 || quantity <= threshold) {
      alerts.push(buildStockoutAlert(item));
    }
  }
  return alerts;
}

/**
 * Expiry rules:
 *   - expiry already passed         → critical (expired)
 *   - expiry within warning window  → warning  (expiring soon)
 */
export function evaluateExpiryAlerts(
  items: InventoryItem[],
  now: Date = new Date(),
  expiryWarningDays: number = EXPIRY_WARNING_DAYS,
): InventoryAlert[] {
  const alerts: InventoryAlert[] = [];
  for (const item of items) {
    const expiry = parseExpiry(item.expiry_date);
    if (!expiry) continue;

    const name = item.item_name ?? "Unknown item";
    const quantity = Number(item.quantity) || 0;
    const threshold = Number(item.minimum_threshold ?? 0) || 0;
    const days = Math.floor((expiry.getTime() - now.getTime()) / MS_PER_DAY);

    if (days < 0) {
      alerts.push({
        item_id: item.item_id,
        item_name: name,
        type: "expiry",
        severity: "critical",
        quantity,
        threshold,
        daysUntilExpiry: days,
        message: `${name} has expired.`,
      });
    } else if (days <= expiryWarningDays) {
      alerts.push({
        item_id: item.item_id,
        item_name: name,
        type: "expiry",
        severity: "warning",
        quantity,
        threshold,
        daysUntilExpiry: days,
        message:
          days === 0
            ? `${name} expires today.`
            : `${name} expires in ${days} day${days === 1 ? "" : "s"}.`,
      });
    }
  }
  return alerts;
}

/**
 * Pure, fully client-side evaluation (stockout + expiry) over a list of items.
 * Used as a fallback and in tests; the live UI prefers `fetchInventoryAlerts`.
 */
export function evaluateInventoryAlerts(
  items: InventoryItem[],
  now: Date = new Date(),
  expiryWarningDays: number = EXPIRY_WARNING_DAYS,
): InventoryAlert[] {
  return sortAlerts([
    ...evaluateStockoutAlerts(items),
    ...evaluateExpiryAlerts(items, now, expiryWarningDays),
  ]);
}

/** Roll up alerts into counts for badges / summaries. */
export function summarizeAlerts(alerts: InventoryAlert[]): AlertSummary {
  return {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === "critical").length,
    warning: alerts.filter((a) => a.severity === "warning").length,
  };
}

/**
 * End-to-end alert pipeline for the UI.
 *
 * Stockout alerts come from the backend (server-configured thresholds via
 * GET /api/inventory/alerts); expiry alerts are derived client-side from the
 * raw inventory. `now` is injectable to keep this deterministic in tests.
 */
export async function fetchInventoryAlerts(
  now: Date = new Date(),
): Promise<InventoryAlert[]> {
  const [stock, items] = await Promise.all([
    apiFetch<StockAlertsResponse>("/api/inventory/alerts"),
    apiFetch<InventoryItem[]>("/api/inventory"),
  ]);

  const stockoutAlerts = (stock.items_at_risk ?? []).map(buildStockoutAlert);
  const expiryAlerts = evaluateExpiryAlerts(items, now);

  return sortAlerts([...stockoutAlerts, ...expiryAlerts]);
}

/**
 * Update a single item's minimum safety threshold via the dedicated backend
 * endpoint (PUT /api/inventory/<id>/threshold). Drives stockout alerting.
 */
export async function configureThreshold(
  itemId: number,
  minimumThreshold: number,
): Promise<void> {
  await apiFetch<{ message: string }>(`/api/inventory/${itemId}/threshold`, {
    method: "PUT",
    body: JSON.stringify({ minimum_threshold: minimumThreshold }),
  });
}
