"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { apiFetch } from "@/lib/api";
import { configureThreshold } from "@/lib/alerts";
import { getUser, normalizeRole } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import type { InventoryItem } from "@/types/index";

// ─── Icons ───────────────────────────────────────────────────────────────────

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

// ─── Form state ───────────────────────────────────────────────────────────────

type FormValues = {
  item_id: string;
  item_name: string;
  category: string;
  quantity: string;
  minimum_threshold: string;
  expiry_date: string;
};

const EMPTY_FORM: FormValues = {
  item_id: "",
  item_name: "",
  category: "",
  quantity: "",
  minimum_threshold: "",
  expiry_date: "",
};

const inputCls =
  "w-full rounded-xl border border-slate-700/60 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-150 disabled:opacity-50";

// ─── Page ────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [formMode, setFormMode] = useState<"hidden" | "add" | "edit">("hidden");
  const [formValues, setFormValues] = useState<FormValues>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Inline minimum-threshold editing (dedicated /threshold endpoint)
  const [thresholdEditId, setThresholdEditId] = useState<number | null>(null);
  const [thresholdValue, setThresholdValue] = useState("");
  const [savingThreshold, setSavingThreshold] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────────

  async function loadInventory() {
    setLoading(true);
    setPageError(null);
    try {
      const data = await apiFetch<InventoryItem[]>("/api/inventory");
      setItems(data);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCurrentUser(getUser());
    loadInventory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const role     = normalizeRole(currentUser?.role);
  const canAdd    = role === "Admin" || role === "Manager";
  const canEdit   = role === "Admin" || role === "Manager";
  const canDelete = role === "Admin";

  // ── Derived ────────────────────────────────────────────────────────────────

  const filtered = items.filter(
    (item) =>
      item.item_name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Form helpers ───────────────────────────────────────────────────────────

  function openAdd() {
    setFormValues(EMPTY_FORM);
    setFormError(null);
    setEditingId(null);
    setFormMode("add");
  }

  function openEdit(item: InventoryItem) {
    setFormValues({
      item_id: String(item.item_id),
      item_name: item.item_name,
      category: item.category,
      quantity: String(item.quantity),
      minimum_threshold: item.minimum_threshold != null ? String(item.minimum_threshold) : "0",
      expiry_date: item.expiry_date ? item.expiry_date.slice(0, 10) : "",
    });
    setFormError(null);
    setEditingId(item.item_id);
    setFormMode("edit");
  }

  function cancelForm() {
    setFormMode("hidden");
    setFormValues(EMPTY_FORM);
    setEditingId(null);
    setFormError(null);
  }

  function handleField(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      if (formMode === "add") {
        await apiFetch<{ message: string }>("/api/inventory", {
          method: "POST",
          body: JSON.stringify({
            item_id: Number(formValues.item_id),
            item_name: formValues.item_name,
            category: formValues.category,
            quantity: Number(formValues.quantity),
            minimum_threshold: Number(formValues.minimum_threshold),
            expiry_date: formValues.expiry_date || null,
          }),
        });
      } else {
        await apiFetch<{ message: string }>(`/api/inventory/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({
            item_name: formValues.item_name,
            category: formValues.category,
            quantity: Number(formValues.quantity),
            minimum_threshold: Number(formValues.minimum_threshold),
            expiry_date: formValues.expiry_date || null,
          }),
        });
      }
      await loadInventory();
      cancelForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(item: InventoryItem) {
    if (!window.confirm(`Delete "${item.item_name}"? This cannot be undone.`)) return;
    setPageError(null);
    try {
      await apiFetch<{ message: string }>(`/api/inventory/${item.item_id}`, {
        method: "DELETE",
      });
      await loadInventory();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to delete item");
    }
  }

  // ── Inline threshold config ──────────────────────────────────────────────────

  function startThresholdEdit(item: InventoryItem) {
    setThresholdEditId(item.item_id);
    setThresholdValue(item.minimum_threshold != null ? String(item.minimum_threshold) : "0");
    setPageError(null);
  }

  function cancelThresholdEdit() {
    setThresholdEditId(null);
    setThresholdValue("");
  }

  async function saveThreshold(item: InventoryItem) {
    const next = Number(thresholdValue);
    if (Number.isNaN(next) || next < 0) {
      setPageError("Threshold must be a non-negative number.");
      return;
    }
    setSavingThreshold(true);
    setPageError(null);
    try {
      await configureThreshold(item.item_id, next);
      await loadInventory();
      cancelThresholdEdit();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to update threshold");
    } finally {
      setSavingThreshold(false);
    }
  }

  // ── Expiry display ─────────────────────────────────────────────────────────

  function formatExpiry(val: string | null | undefined): string {
    if (!val) return "—";
    return val.slice(0, 10);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Topbar title="Inventory Overview" />

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">

        {/* Page-level error banner */}
        {pageError && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400">
            <span>{pageError}</span>
            <button
              onClick={() => setPageError(null)}
              className="ml-4 rounded p-0.5 hover:text-red-300 transition-colors"
              aria-label="Dismiss"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Search + Add (responsive) ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
              <SearchIcon />
            </div>
            <input
              type="search"
              placeholder="Search by name or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-700/60 bg-slate-900/50 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-150"
            />
          </div>

          {canAdd && (
            <button
              onClick={openAdd}
              className="inline-flex w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-cyan-400 active:scale-[0.98] transition-all duration-150 shadow-md shadow-cyan-500/20"
            >
              <PlusIcon />
              Add Item
            </button>
          )}
        </div>

        {/* ── Add / Edit form panel ── */}
        {formMode !== "hidden" && (
          <div className="mb-5 rounded-2xl border border-slate-700/60 bg-slate-900/50 backdrop-blur-sm p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-slate-100">
                {formMode === "add" ? "Add New Item" : "Edit Item"}
              </h2>
              <button
                type="button"
                onClick={cancelForm}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
                aria-label="Close form"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Item ID
                  </label>
                  <input
                    name="item_id"
                    type="number"
                    required
                    readOnly={formMode === "edit"}
                    value={formValues.item_id}
                    onChange={handleField}
                    placeholder="e.g. 103"
                    className={
                      inputCls +
                      (formMode === "edit" ? " cursor-not-allowed opacity-40" : "")
                    }
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Item Name
                  </label>
                  <input
                    name="item_name"
                    type="text"
                    required
                    value={formValues.item_name}
                    onChange={handleField}
                    placeholder="e.g. Fresh Tomatoes"
                    className={inputCls}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Category
                  </label>
                  <input
                    name="category"
                    type="text"
                    required
                    value={formValues.category}
                    onChange={handleField}
                    placeholder="e.g. Produce"
                    className={inputCls}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Quantity
                  </label>
                  <input
                    name="quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formValues.quantity}
                    onChange={handleField}
                    placeholder="e.g. 120"
                    className={inputCls}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Min Threshold
                  </label>
                  <input
                    name="minimum_threshold"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formValues.minimum_threshold}
                    onChange={handleField}
                    placeholder="e.g. 30"
                    className={inputCls}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Expiry Date{" "}
                    <span className="normal-case font-normal text-slate-600">(optional)</span>
                  </label>
                  <input
                    name="expiry_date"
                    type="date"
                    value={formValues.expiry_date}
                    onChange={handleField}
                    className={inputCls}
                  />
                </div>

              </div>

              <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-cyan-400 active:scale-[0.98] transition-all duration-150 shadow-sm shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-600 border-t-slate-900" />
                      Saving…
                    </>
                  ) : formMode === "add" ? (
                    "Create Item"
                  ) : (
                    "Save Changes"
                  )}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-700/60 px-5 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-600 transition-all duration-150"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Loading state ── */}
        {loading && (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/30 py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-800 border-t-cyan-400" />
            <span className="text-sm text-slate-500">Loading inventory…</span>
          </div>
        )}

        {/* ── Table (horizontal scroll on mobile) ── */}
        {!loading && (
          <div className="overflow-x-auto rounded-2xl border border-slate-800/60 bg-slate-900/30 backdrop-blur-sm">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-800/60 bg-slate-900/50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Item Name
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Category
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Quantity
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Min
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Expiry
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-14 text-center text-sm text-slate-600"
                    >
                      {search
                        ? `No items match "${search}".`
                        : "No inventory items found."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const threshold = item.minimum_threshold ?? 0;
                    const isLow = item.quantity <= threshold;
                    return (
                      <tr
                        key={item.item_id}
                        className="border-t border-slate-800/50 hover:bg-slate-800/25 transition-colors duration-100"
                      >
                        <td className="px-5 py-4 font-medium text-slate-100">
                          {item.item_name}
                        </td>
                        <td className="px-5 py-4 text-slate-400">{item.category}</td>
                        <td className="px-5 py-4">
                          <span
                            className={
                              isLow ? "font-semibold text-orange-400" : "text-slate-300"
                            }
                          >
                            {item.quantity}
                          </span>
                          {isLow && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 text-xs font-medium text-orange-400">
                              Low
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-400 tabular-nums">
                          {thresholdEditId === item.item_id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                autoFocus
                                value={thresholdValue}
                                onChange={(e) => setThresholdValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveThreshold(item);
                                  if (e.key === "Escape") cancelThresholdEdit();
                                }}
                                className="w-20 rounded-lg border border-slate-700/60 bg-slate-800/60 px-2 py-1 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                              />
                              <button
                                onClick={() => saveThreshold(item)}
                                disabled={savingThreshold}
                                className="rounded-md p-1 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
                                aria-label="Save threshold"
                              >
                                {savingThreshold ? (
                                  <span className="block h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
                                ) : (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                    <path d="M20 6L9 17l-5-5" />
                                  </svg>
                                )}
                              </button>
                              <button
                                onClick={cancelThresholdEdit}
                                disabled={savingThreshold}
                                className="rounded-md p-1 text-slate-500 hover:bg-slate-700/60 hover:text-slate-300 disabled:opacity-50"
                                aria-label="Cancel"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                  <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span>{item.minimum_threshold ?? "—"}</span>
                              {canEdit && (
                                <button
                                  onClick={() => startThresholdEdit(item)}
                                  className="rounded-md p-1 text-slate-600 hover:bg-slate-700/60 hover:text-cyan-400 transition-colors"
                                  aria-label={`Configure threshold for ${item.item_name}`}
                                  title="Configure minimum threshold"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-400 tabular-nums">
                          {formatExpiry(item.expiry_date)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {canEdit && (
                              <button
                                onClick={() => openEdit(item)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-700/60 hover:text-cyan-400 transition-all duration-150"
                                aria-label={`Edit ${item.item_name}`}
                              >
                                <EditIcon />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(item)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
                                aria-label={`Delete ${item.item_name}`}
                              >
                                <TrashIcon />
                              </button>
                            )}
                            {!canEdit && !canDelete && (
                              <span className="text-xs text-slate-700 px-2">View only</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </>
  );
}
