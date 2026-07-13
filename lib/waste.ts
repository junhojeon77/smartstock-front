import { apiFetch } from "@/lib/api";
import type { InventoryItem, WasteEntry } from "@/types/index";

/**
 * Waste log client + analytics helpers.
 *
 * The backend owns the log (POST/GET /api/waste); these helpers validate the
 * untrusted payload and aggregate it for the charts and summary tiles.
 */

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Validate one untrusted waste-log row; null if malformed. */
export function parseWasteEntry(raw: unknown): WasteEntry | null {
  if (typeof raw !== "object" || raw === null) return null;
  const e = raw as Record<string, unknown>;
  if (!isFiniteNumber(e.item_id)) return null;
  if (typeof e.item_name !== "string") return null;
  if (!isFiniteNumber(e.quantity)) return null;
  if (typeof e.timestamp !== "string") return null;
  return {
    log_id: isFiniteNumber(e.log_id) ? e.log_id : 0,
    item_id: e.item_id,
    item_name: e.item_name,
    quantity: e.quantity,
    reason: typeof e.reason === "string" ? e.reason : "unspecified",
    logged_by: typeof e.logged_by === "string" ? e.logged_by : "unknown",
    timestamp: e.timestamp,
  };
}

/** Fetch the waste log (newest first), dropping malformed rows. */
export async function fetchWasteLog(): Promise<WasteEntry[]> {
  const raw = await apiFetch<unknown>("/api/waste");
  if (!Array.isArray(raw)) {
    throw new Error("Invalid waste log response: expected an array.");
  }
  return raw
    .map(parseWasteEntry)
    .filter((e): e is WasteEntry => e !== null);
}

/**
 * Record wasted stock, then decrement the item's inventory quantity to match
 * (clamped at 0). The waste log is written first so a failed decrement never
 * loses the record.
 */
export async function logWaste(
  item: InventoryItem,
  quantity: number,
  reason: string,
): Promise<void> {
  await apiFetch<{ message: string }>("/api/waste", {
    method: "POST",
    body: JSON.stringify({ item_id: item.item_id, quantity, reason }),
  });
  await apiFetch<{ message: string }>(`/api/inventory/${item.item_id}`, {
    method: "PUT",
    body: JSON.stringify({ quantity: Math.max(0, item.quantity - quantity) }),
  });
}

export type WastePoint = { label: string; value: number };

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Sum wasted quantity into the last `months` calendar months (oldest first,
 * empty months included) for the trend chart.
 */
export function bucketWasteByMonth(
  entries: WasteEntry[],
  now: Date = new Date(),
  months = 6,
): WastePoint[] {
  const buckets: WastePoint[] = [];
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${d.getMonth()}`);
    buckets.push({ label: MONTH_LABELS[d.getMonth()], value: 0 });
  }
  for (const entry of entries) {
    const t = new Date(entry.timestamp);
    if (Number.isNaN(t.getTime())) continue;
    const idx = keys.indexOf(`${t.getFullYear()}-${t.getMonth()}`);
    if (idx !== -1) buckets[idx].value += entry.quantity;
  }
  return buckets;
}

export type WasteSummary = {
  totalQuantity: number;
  entryCount: number;
  topItem: string | null;
  topReason: string | null;
};

/** Totals plus the most-wasted item (by quantity) and most common reason. */
export function summarizeWaste(entries: WasteEntry[]): WasteSummary {
  let totalQuantity = 0;
  const byItem = new Map<string, number>();
  const byReason = new Map<string, number>();
  for (const e of entries) {
    totalQuantity += e.quantity;
    byItem.set(e.item_name, (byItem.get(e.item_name) ?? 0) + e.quantity);
    byReason.set(e.reason, (byReason.get(e.reason) ?? 0) + 1);
  }
  const top = (m: Map<string, number>) =>
    [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return {
    totalQuantity,
    entryCount: entries.length,
    topItem: top(byItem),
    topReason: top(byReason),
  };
}
