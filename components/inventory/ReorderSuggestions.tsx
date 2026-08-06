"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { suggestReorders, STATUS_STYLES } from "@/lib/inventory";
import { Button } from "@/components/ui/Button";
import type { InventoryItem } from "@/types/index";

// Exported so the Settings page can reset these over shared state.
export const DISMISSED_KEY = "smartstock_reorder_dismissed";
export const OVERRIDES_KEY = "smartstock_reorder_overrides";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

type Props = {
  items: InventoryItem[];
  loading: boolean;
};

/**
 * Explainable AI procurement recommendations. Every suggestion shows the
 * arithmetic behind it (from suggestReorders' `reason`), the quantity is
 * editable inline (override persisted per item), and one tap dismisses a
 * suggestion. Overrides/dismissals live in localStorage — the AI is an
 * assistant, not a dictator.
 */
export function ReorderSuggestions({ items, loading }: Props) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [overrides, setOverrides] = useState<Record<number, number>>({});
  const [itemFilter, setItemFilter] = useState<"all" | number>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setDismissed(readJson<number[]>(DISMISSED_KEY, []));
    setOverrides(readJson<Record<number, number>>(OVERRIDES_KEY, {}));
  }, []);

  // Local, case-insensitive match on name + category. All data is already on
  // the client, so this never hits the API.
  const query = search.trim().toLowerCase();
  const matchesQuery = (name: string, category: string | undefined) =>
    !query ||
    name.toLowerCase().includes(query) ||
    (category ?? "").toLowerCase().includes(query);

  const all = suggestReorders(items);
  const visible = all.filter(
    (r) =>
      !dismissed.includes(r.item.item_id) &&
      (itemFilter === "all" || r.item.item_id === itemFilter) &&
      matchesQuery(r.item.item_name, r.item.category),
  );
  const hiddenCount =
    all.filter((r) => dismissed.includes(r.item.item_id)).length;
  const filteredItem =
    itemFilter === "all"
      ? null
      : items.find((i) => i.item_id === itemFilter) ?? null;

  const dismiss = (id: number) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
  };

  const restoreAll = () => {
    setDismissed([]);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([]));
  };

  const setOverride = (id: number, qty: number, suggested: number) => {
    const next = { ...overrides };
    if (!Number.isFinite(qty) || qty === suggested) delete next[id];
    else next[id] = qty;
    setOverrides(next);
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(next));
  };

  return (
    <div className="rounded-xl border border-slate-800/70 bg-slate-900/40 backdrop-blur-sm p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          Reorder Recommendations
        </h2>
        <select
          value={itemFilter}
          onChange={(e) =>
            setItemFilter(e.target.value === "all" ? "all" : Number(e.target.value))
          }
          aria-label="Filter recommendations by item"
          className="rounded-md border border-slate-700/60 bg-slate-800/60 px-2 py-1 text-xs text-slate-300 focus:border-violet-500/50 focus:outline-none"
        >
          <option value="all">All items</option>
          {items.map((i) => (
            <option key={i.item_id} value={i.item_id}>
              {i.item_name}
            </option>
          ))}
        </select>
      </div>

      {/* Local search over name + category */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[10rem] flex-1">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by item or category…"
            aria-label="Search recommendations by item name or category"
            className="w-full rounded-md border border-slate-700/60 bg-slate-800/60 py-1.5 pl-8 pr-8 text-xs text-slate-200 placeholder:text-slate-600 focus:border-violet-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear recommendation search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 transition-colors hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <span className="shrink-0 text-[11px] tabular-nums text-slate-500">
          {visible.length} of {all.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-600">
          {loading
            ? "Loading…"
            : query
              ? "No recommendations match your search."
              : filteredItem
                ? all.some((r) => r.item.item_id === itemFilter)
                  ? `Suggestion for ${filteredItem.item_name} was dismissed.`
                  : `No action needed — ${filteredItem.item_name} looks healthy.`
                : hiddenCount > 0
                  ? "All suggestions dismissed."
                  : "No reorders needed — stock looks healthy."}
        </p>
      ) : (
        <ul className="flex max-h-96 flex-col divide-y divide-slate-800/60 overflow-y-auto">
          {visible.map(({ item, suggestedQty, reason, status, severity }) => {
            const value = overrides[item.item_id] ?? suggestedQty;
            const overridden = value !== suggestedQty;
            return (
              <li key={item.item_id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-200">
                      {item.item_name}
                    </span>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[status]}`}
                      title={severity === "critical" ? "Critical" : "Warning"}
                    >
                      {severity === "critical" ? "❗" : "⚠"} {status}
                    </span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      value={value}
                      onChange={(e) =>
                        setOverride(
                          item.item_id,
                          e.target.valueAsNumber,
                          suggestedQty,
                        )
                      }
                      aria-label={`Order quantity for ${item.item_name}`}
                      className="w-16 rounded-md border border-slate-700/60 bg-slate-800/60 px-2 py-1 text-right text-xs tabular-nums text-slate-200 focus:border-violet-500/50 focus:outline-none"
                    />
                    <span className="text-xs text-slate-500">units</span>
                    <Button
                      variant="secondary"
                      className="px-2.5 py-1 text-xs"
                      onClick={() =>
                        router.push(`/sourcing?item=${item.item_id}`)
                      }
                    >
                      Order
                    </Button>
                    <button
                      onClick={() => dismiss(item.item_id)}
                      aria-label={`Dismiss suggestion for ${item.item_name}`}
                      title="Dismiss suggestion"
                      className="rounded p-1 text-slate-600 transition-colors hover:text-slate-300"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {reason}
                  {overridden && (
                    <span className="ml-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-1.5 py-0.5 text-[11px] font-medium text-violet-400">
                      Your override · AI suggested {suggestedQty}
                    </span>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {hiddenCount > 0 && (
        <button
          onClick={restoreAll}
          className="mt-3 text-xs text-slate-500 underline-offset-2 transition-colors hover:text-slate-300 hover:underline"
        >
          {hiddenCount} dismissed — restore
        </button>
      )}
    </div>
  );
}
