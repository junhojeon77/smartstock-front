"use client";

import { useState } from "react";
import { logWaste } from "@/lib/waste";
import type { InventoryItem } from "@/types/index";

const REASONS = ["Expired", "Spoiled", "Damaged", "Over-production", "Other"];

const inputCls =
  "w-full rounded-xl border border-slate-700/60 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-150 disabled:opacity-50";

type Props = {
  items: InventoryItem[];
  /** When set, the item is fixed (per-row logging) instead of a dropdown. */
  presetItem?: InventoryItem;
  onLogged: () => void;
};

/** Records discarded stock: POST /api/waste + inventory decrement. */
export function LogWasteForm({ items, presetItem, onLogged }: Props) {
  const [itemId, setItemId] = useState(presetItem ? String(presetItem.item_id) : "");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Searchable item picker (non-preset case): type to filter, list caps at ~5 rows.
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const item = presetItem ?? items.find((i) => String(i.item_id) === itemId);
  const matches = query.trim()
    ? items.filter((i) => i.item_name.toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const qty = Number(quantity);
    if (!item) {
      setError("Select an item.");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }
    const available = Number(item.quantity) || 0;
    if (qty > available) {
      setError(
        `Cannot log ${qty} — only ${available} of ${item.item_name} in stock.`,
      );
      return;
    }
    setSubmitting(true);
    try {
      await logWaste(item, qty, reason);
      setQuantity("");
      onLogged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log waste");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Item
          </label>
          {presetItem ? (
            <div className={inputCls + " cursor-default opacity-70"}>
              {presetItem.item_name}
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={open ? query : item ? item.item_name : query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setItemId("");
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 120)}
                placeholder="Search for an item…"
                className={inputCls}
              />
              {open && (
                <ul className="absolute bottom-full z-30 mb-1 max-h-[11.5rem] w-full overflow-y-auto rounded-xl border border-slate-700/60 bg-slate-800 shadow-lg">
                  {matches.length === 0 ? (
                    <li className="px-3 py-2.5 text-sm text-slate-500">No items match.</li>
                  ) : (
                    matches.map((i) => (
                      <li key={i.item_id}>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setItemId(String(i.item_id));
                            setQuery("");
                            setOpen(false);
                          }}
                          className={
                            "block w-full px-3 py-2.5 text-left text-sm text-slate-100 hover:bg-slate-700/60 transition-colors " +
                            (String(i.item_id) === itemId ? "bg-slate-700/40" : "")
                          }
                        >
                          {i.item_name}{" "}
                          <span className="text-slate-500">(stock: {i.quantity})</span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <label
              htmlFor="waste-quantity"
              className="text-xs font-medium text-slate-500 uppercase tracking-wide"
            >
              Quantity Wasted
            </label>
            <span className="text-xs tabular-nums text-slate-400">
              Available: {item ? item.quantity : "—"}
            </span>
          </div>
          <input
            id="waste-quantity"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 5"
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Reason
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={inputCls}
          >
            {REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-cyan-400 active:scale-[0.98] transition-all duration-150 shadow-sm shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-600 border-t-slate-900" />
              Logging…
            </>
          ) : (
            "Log Waste"
          )}
        </button>
      </div>
    </form>
  );
}
