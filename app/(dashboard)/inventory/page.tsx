"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import type { InventoryItem } from "@/types/index";

// ─── Icons (unchanged from original) ────────────────────────────────────────

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

// ─── Form state ──────────────────────────────────────────────────────────────

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

// ─── Shared Tailwind class for form inputs ───────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20";

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

  const role = currentUser?.role ?? "";
  const canAdd = role === "Admin" || role === "Manager";
  const canEdit = role === "Admin" || role === "Manager";
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
      minimum_threshold: String(item.minimum_threshold),
      // Handles both ISO datetime strings ("2026-05-25T00:00:00+00:00") and plain date strings ("2026-05-25")
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

  // ── Submit (add or edit) ───────────────────────────────────────────────────

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
        // Do not include item_id in the $set payload — it is the lookup key
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

  // ── Expiry display ─────────────────────────────────────────────────────────

  function formatExpiry(val: string | null): string {
    if (!val) return "N/A";
    // Slice to YYYY-MM-DD regardless of whether backend sent an ISO datetime or a plain date string
    return val.slice(0, 10);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Topbar title="Inventory Overview" />

      <div className="flex-1 px-8 pb-8">

        {/* Page-level error banner */}
        {pageError && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <span>{pageError}</span>
            <button
              onClick={() => setPageError(null)}
              className="ml-4 font-medium text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search + Add button */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </div>
            <input
              type="search"
              placeholder="Search by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 pl-10 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          {canAdd && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-cyan-400"
            >
              <PlusIcon />
              Add Item
            </button>
          )}
        </div>

        {/* Add / Edit form panel */}
        {formMode !== "hidden" && (
          <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800/60 p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-100">
              {formMode === "add" ? "Add New Item" : "Edit Item"}
            </h2>

            {formError && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
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
                      (formMode === "edit" ? " cursor-not-allowed opacity-50" : "")
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
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

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
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

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
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

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
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

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    Expiry Date{" "}
                    <span className="font-normal text-slate-500">(optional)</span>
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

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-medium text-slate-900 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Saving…"
                    : formMode === "add"
                    ? "Create Item"
                    : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="rounded-lg border border-slate-600 px-5 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-slate-800 bg-slate-800/60 px-5 py-12 text-center text-sm text-slate-400">
            Loading inventory…
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-800/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/80 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 text-left font-medium">Item Name</th>
                  <th className="px-5 py-3 text-left font-medium">Category</th>
                  <th className="px-5 py-3 text-left font-medium">Quantity</th>
                  <th className="px-5 py-3 text-left font-medium">Min Threshold</th>
                  <th className="px-5 py-3 text-left font-medium">Expiry Date</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                      {search ? "No items match your search." : "No inventory items found."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const isLow = item.quantity <= item.minimum_threshold;
                    return (
                      <tr
                        key={item.item_id}
                        className="border-t border-slate-800 hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4 text-slate-100">{item.item_name}</td>
                        <td className="px-5 py-4 text-slate-300">{item.category}</td>
                        <td className="px-5 py-4">
                          <span className={isLow ? "font-medium text-orange-400" : "text-slate-300"}>
                            {item.quantity}
                          </span>
                          {isLow && (
                            <span className="ml-2 rounded bg-orange-500/15 px-1.5 py-0.5 text-xs text-orange-400">
                              Low
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-300">{item.minimum_threshold}</td>
                        <td className="px-5 py-4 text-slate-300">{formatExpiry(item.expiry_date)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {canEdit && (
                              <button
                                onClick={() => openEdit(item)}
                                className="rounded-md p-1.5 text-cyan-400 hover:bg-slate-700"
                                aria-label={`Edit ${item.item_name}`}
                              >
                                <EditIcon />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(item)}
                                className="rounded-md p-1.5 text-red-400 hover:bg-slate-700"
                                aria-label={`Delete ${item.item_name}`}
                              >
                                <TrashIcon />
                              </button>
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
