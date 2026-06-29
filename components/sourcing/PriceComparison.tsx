"use client";

import { useEffect, useState } from "react";
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
 * Supplier price comparison. On open it loads every inventory item's offers
 * (GET /api/inventory/<id>/prices) and lists them grouped by item, cheapest
 * first, with the lowest-price offer highlighted (backend flags `is_lowest`).
 */
export function PriceComparison({ items: itemsProp }: Props = {}) {
  const [rows, setRows] = useState<ItemPrices[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      {!loading && rows.length > 0 && (
        <div className="mt-5 overflow-hidden rounded-lg border border-slate-800/70">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/70 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5 font-medium">Item</th>
                <th className="px-4 py-2.5 font-medium">Supplier</th>
                <th className="px-4 py-2.5 text-right font-medium">Unit Price</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ item, prices }) =>
                prices.offers.map((offer, i) => (
                  <tr
                    key={`${item.item_id}-${offer.supplier_id}`}
                    className={`border-b border-slate-800/40 last:border-0 ${
                      offer.is_lowest ? "bg-emerald-500/10" : ""
                    } ${i === 0 ? "border-t-2 border-t-slate-800/70" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {i === 0 ? item.item_name : ""}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {offer.supplier_name}
                      {offer.is_lowest && (
                        <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                          Lowest
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums ${
                        offer.is_lowest
                          ? "font-semibold text-emerald-400"
                          : "text-slate-300"
                      }`}
                    >
                      {currency.format(offer.price)}
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
