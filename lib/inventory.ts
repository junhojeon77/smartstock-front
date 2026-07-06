import { EXPIRY_WARNING_DAYS } from "@/lib/alerts";
import type { InventoryItem } from "@/types/index";

/**
 * Shared inventory-status helpers used by the AI Assistant tabs.
 *
 * Mirrors the alert rules in lib/alerts.ts so status badges, reorder
 * suggestions, and the alerts center all agree.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type ItemStatus =
  | "Out of Stock"
  | "Expired"
  | "Low Stock"
  | "Expiring Soon"
  | "Healthy";

/** Single status per item, by priority (worst first). */
export function getItemStatus(
  item: InventoryItem,
  now: Date = new Date(),
): ItemStatus {
  const quantity = Number(item.quantity) || 0;
  const threshold = Number(item.minimum_threshold ?? 0) || 0;

  if (quantity <= 0) return "Out of Stock";

  const exp = item.expiry_date ? new Date(item.expiry_date) : null;
  const expValid = exp != null && !Number.isNaN(exp.getTime());
  const days = expValid
    ? Math.floor((exp!.getTime() - now.getTime()) / MS_PER_DAY)
    : null;

  if (days != null && days < 0) return "Expired";
  if (quantity <= threshold) return "Low Stock";
  if (days != null && days <= EXPIRY_WARNING_DAYS) return "Expiring Soon";
  return "Healthy";
}

export const STATUS_STYLES: Record<ItemStatus, string> = {
  "Out of Stock": "bg-red-500/10 text-red-400 border-red-500/20",
  Expired: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Low Stock": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Expiring Soon": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Healthy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export type ReorderSeverity = "critical" | "warning";

export type ReorderSuggestion = {
  item: InventoryItem;
  suggestedQty: number;
  /** Human-readable math behind the suggestion, built from the real inputs. */
  reason: string;
  /** The status that triggered the suggestion (drives the badge). */
  status: ItemStatus;
  /** Out of stock / expired = critical; low stock / expiring soon = warning. */
  severity: ReorderSeverity;
};

/**
 * Derive reorder suggestions for every non-healthy item, critical first.
 * Stock suggestions top up to roughly 2× the threshold (min 10 units when no
 * threshold is configured); expiry suggestions replace the affected stock.
 * Each suggestion carries a `reason` explaining the arithmetic so the UI can
 * show its work.
 */
export function suggestReorders(
  items: InventoryItem[],
  now: Date = new Date(),
): ReorderSuggestion[] {
  const suggestions: ReorderSuggestion[] = [];

  for (const item of items) {
    const status = getItemStatus(item, now);
    if (status === "Healthy") continue;

    const quantity = Number(item.quantity) || 0;
    const threshold = Number(item.minimum_threshold ?? 0) || 0;
    const target = threshold > 0 ? threshold * 2 : 10;
    const exp = item.expiry_date ? new Date(item.expiry_date) : null;
    const daysToExpiry = exp
      ? Math.floor((exp.getTime() - now.getTime()) / MS_PER_DAY)
      : null;

    let suggestedQty: number;
    let reason: string;
    switch (status) {
      case "Out of Stock":
        suggestedQty = Math.max(target, 1);
        reason =
          threshold > 0
            ? `Out of stock — restocking to 2× your ${threshold}-unit minimum (${target}).`
            : `${quantity} on hand with no minimum set — suggesting the default buffer of 10.`;
        break;
      case "Expired":
        suggestedQty = Math.max(target, 1);
        reason = `Expired — replace the ${quantity} unusable units on hand (target ${target}).`;
        break;
      case "Expiring Soon":
        suggestedQty = Math.max(Math.ceil(quantity), 1);
        reason = `${daysToExpiry === 0 ? "Expires today" : `Expires in ${daysToExpiry} day${daysToExpiry === 1 ? "" : "s"}`} — plan to replace the ${quantity} units on hand.`;
        break;
      default: // Low Stock
        suggestedQty = Math.max(target - quantity, 1);
        reason = `${quantity} on hand is at or below your ${threshold}-unit minimum — topping up to 2× minimum (${target}).`;
    }

    const severity: ReorderSeverity =
      status === "Out of Stock" || status === "Expired"
        ? "critical"
        : "warning";
    suggestions.push({ item, suggestedQty, reason, status, severity });
  }

  return suggestions.sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1,
  );
}
