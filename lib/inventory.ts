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

export type ReorderSuggestion = {
  item: InventoryItem;
  suggestedQty: number;
};

/**
 * Derive reorder suggestions for items at or below their stock threshold.
 * Suggests topping up to roughly 2× the threshold (min 10 units when no
 * threshold is configured).
 */
export function suggestReorders(
  items: InventoryItem[],
  now: Date = new Date(),
): ReorderSuggestion[] {
  return items
    .filter((item) => {
      const status = getItemStatus(item, now);
      return status === "Low Stock" || status === "Out of Stock";
    })
    .map((item) => {
      const threshold = Number(item.minimum_threshold ?? 0) || 0;
      const target = threshold > 0 ? threshold * 2 : 10;
      const suggestedQty = Math.max(target - (Number(item.quantity) || 0), 1);
      return { item, suggestedQty };
    });
}
