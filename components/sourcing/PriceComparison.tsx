"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { fetchItemPrices } from "@/lib/suppliers";
import { Card } from "@/components/ui/Card";
import type { ItemPricesResponse, InventoryItem } from "@/types/index";

const currency = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

/** An item paired with its fetched supplier offers. */
type ItemPrices = { item: InventoryItem; prices: ItemPricesResponse };

type Props = {
  /** Items to compare. Self-fetches GET /api/inventory when omitted. */
  items?: InventoryItem[];
};

/**
 * Per-item headline figures derived from the offers the backend already
 * ranked. The backend sorts cheapest-first and flags `is_lowest`; nothing here
 * re-ranks or recalculates the best price.
 */
function summarise(prices: ItemPricesResponse) {
  const offers = prices.offers;
  const best = offers.find((o) => o.is_lowest) ?? offers[0];
  const highest = offers.reduce((a, b) => (b.price > a.price ? b : a), offers[0]);
  const savingsPct =
    offers.length > 1 && highest.price > 0
      ? Math.round(((highest.price - prices.best_price) / highest.price) * 100)
      : 0;
  return { best, highest, savingsPct, count: offers.length };
}

/**
 * Supplier price comparison. On open it loads every inventory item's offers
 * (GET /api/inventory/<id>/prices) and lists them grouped by item, cheapest
 * first, with the lowest-price offer highlighted (backend flags `is_lowest`).
 * Groups start collapsed to a one-line summary so the page stays readable as
 * supplier coverage grows; any number of groups can be expanded at once.
 */
export function PriceComparison({ items: itemsProp }: Props = {}) {
  const [rows, setRows] = useState<ItemPrices[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [expanded, setExpanded] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const items =
          itemsProp ?? (await apiFetch<InventoryItem[]>("/api/inventory"));
        // ponytail: one request per item. Fine for a small inventory; swap for
        // a batch endpoint if the item count grows into the hundreds.
        const settled = await Promise.all(
          items.map(async (item) => {
            try {
              return { item, prices: await fetchItemPrices(item.item_id) };
            } catch {
              return null; // skip items the prices endpoint can't serve
            }
          }),
        );
        if (cancelled) return;
        setRows(
          settled.filter(
            (r): r is ItemPrices => r !== null && r.prices.offers.length > 0,
          ),
        );
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load prices.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [itemsProp]);

  // Real, derivable stats over the whole compared set (not the filtered view),
  // so the headline figures stay stable while searching.
  const stats = useMemo(() => {
    const supplierIds = new Set<number>();
    const savings: number[] = [];
    for (const { prices } of rows) {
      const offers = prices.offers;
      for (const o of offers) supplierIds.add(o.supplier_id);
      const max = Math.max(...offers.map((o) => o.price));
      if (max > 0) savings.push((max - prices.best_price) / max);
    }
    const avgSavings =
      savings.length > 0
        ? savings.reduce((a, b) => a + b, 0) / savings.length
        : 0;
    return {
      suppliers: supplierIds.size,
      items: rows.length,
      avgSavingsPct: Math.round(avgSavings * 100),
    };
  }, [rows]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const { item } of rows) if (item.category) set.add(item.category);
    return Array.from(set).sort();
  }, [rows]);

  // Local filtering — all offers are already on the client.
  const query = search.trim().toLowerCase();
  const visible = rows.filter(({ item }) => {
    if (category !== "all" && item.category !== category) return false;
    if (!query) return true;
    return (
      item.item_name.toLowerCase().includes(query) ||
      (item.category ?? "").toLowerCase().includes(query)
    );
  });

  const toggle = (itemId: number) =>
    setExpanded((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );

  const filtering = query !== "" || category !== "all";
  const clearFilters = () => {
    setSearch("");
    setCategory("all");
  };

  return (
    <Card className="p-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">
          Supplier Price Comparison
        </h2>
        <p className="text-sm text-slate-500">
          Vendor offers for every item; the lowest price is highlighted.
        </p>
      </div>

      {!loading && rows.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-800/70 bg-slate-900/40 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Active suppliers
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">
              {stats.suppliers}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800/70 bg-slate-900/40 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Items compared
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">
              {stats.items}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800/70 bg-slate-900/40 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Avg. savings
            </p>
            <p className="mt-1 text-2xl font-semibold text-emerald-400">
              {stats.avgSavingsPct}%
            </p>
            <p className="text-[11px] text-slate-500">best vs. highest offer</p>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {loading && (
        <p className="mt-4 text-sm text-slate-500">Loading supplier prices…</p>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          No supplier offers available yet.
        </p>
      )}

      {/* Search + category filter */}
      {!loading && rows.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
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
              aria-label="Search supplier comparison by item name or category"
              className="w-full rounded-lg border border-slate-700/60 bg-slate-900/60 py-2 pl-8 pr-8 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear supplier search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 transition-colors hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {categories.length > 0 && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter supplier comparison by category"
              className="w-full shrink-0 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 sm:w-auto"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          <span className="shrink-0 text-xs tabular-nums text-slate-500">
            {visible.length} of {rows.length}
          </span>
        </div>
      )}

      {!loading && rows.length > 0 && visible.length === 0 && (
        <div className="mt-4 rounded-lg border border-slate-800/70 bg-slate-900/40 px-4 py-6 text-center">
          <p className="text-sm text-slate-500">
            No items match your search.
          </p>
          {filtering && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 text-xs text-cyan-400 underline-offset-2 transition-colors hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Collapsible product groups */}
      {!loading && visible.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {visible.map(({ item, prices }) => {
            const { best, savingsPct, count } = summarise(prices);
            const isOpen = expanded.includes(item.item_id);
            const panelId = `offers-${item.item_id}`;

            return (
              <div
                key={item.item_id}
                className="overflow-hidden rounded-lg border border-slate-800/70 bg-slate-900/40"
              >
                <button
                  type="button"
                  onClick={() => toggle(item.item_id)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-800/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-100">
                      {item.item_name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {item.category || "Uncategorised"} · {count} offer
                      {count === 1 ? "" : "s"} · best: {best.supplier_name}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold tabular-nums text-emerald-400">
                      {currency.format(prices.best_price)}
                    </span>
                    {savingsPct > 0 && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                        Save {savingsPct}%
                      </span>
                    )}
                    <span className="text-xs text-slate-500">
                      {isOpen ? "Hide offers" : "View all offers"}
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                      className={`h-4 w-4 text-slate-500 transition-transform duration-150 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div id={panelId} className="border-t border-slate-800/70">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800/60 text-left text-xs uppercase tracking-wide text-slate-500">
                          <th scope="col" className="px-4 py-2 font-medium">
                            Supplier
                          </th>
                          <th scope="col" className="px-4 py-2 text-right font-medium">
                            Unit Price
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {prices.offers.map((offer) => (
                          <tr
                            key={`${item.item_id}-${offer.supplier_id}`}
                            className={`border-b border-slate-800/40 last:border-0 ${
                              offer.is_lowest ? "bg-emerald-500/10" : ""
                            }`}
                          >
                            <td className="px-4 py-2.5 text-slate-300">
                              {offer.supplier_name}
                              {offer.is_lowest && (
                                <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                                  Lowest
                                </span>
                              )}
                            </td>
                            <td
                              className={`px-4 py-2.5 text-right tabular-nums ${
                                offer.is_lowest
                                  ? "font-semibold text-emerald-400"
                                  : "text-slate-300"
                              }`}
                            >
                              {currency.format(offer.price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
