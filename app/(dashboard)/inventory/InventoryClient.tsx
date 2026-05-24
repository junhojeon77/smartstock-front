"use client";

import { useMemo, useState } from "react";
import type { InventoryItem } from "@/types";

const seedItems: InventoryItem[] = [
  {
    id: "1",
    name: "Canned Tomatoes",
    category: "Groceries",
    quantity: 250,
    unit: "Boxes",
    threshold: 50,
    expiry: "2025-06-01",
  },
  {
    id: "2",
    name: "Olive Oil (Gallons)",
    category: "Liquids",
    quantity: 45,
    unit: "Gallons",
    threshold: 10,
    expiry: "2024-10-15",
  },
  {
    id: "3",
    name: "Dry Pasta (Lbs)",
    category: "Groceries",
    quantity: 500,
    unit: "Lbs",
    threshold: 100,
    expiry: "2026-01-01",
  },
  {
    id: "4",
    name: "Paper Plates",
    category: "Supplies",
    quantity: 1000,
    unit: "Units",
    threshold: 200,
    expiry: null,
  },
  {
    id: "5",
    name: "Cardboard Boxes",
    category: "Supplies",
    quantity: 300,
    unit: "Units",
    threshold: 100,
    expiry: null,
  },
];

type ModalState =
  | { kind: "add" }
  | { kind: "edit"; item: InventoryItem }
  | { kind: "delete"; item: InventoryItem }
  | null;

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20";

function formatExpiry(iso: string | null): string {
  if (!iso) return "N/A";
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function InventoryClient() {
  const [items, setItems] = useState<InventoryItem[]>(seedItems);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<ModalState>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q),
    );
  }, [items, query]);

  function handleAdd(item: Omit<InventoryItem, "id">) {
    const id = String(Date.now());
    setItems((prev) => [...prev, { ...item, id }]);
    setModal(null);
  }

  function handleEdit(updated: InventoryItem) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setModal(null);
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setModal(null);
  }

  return (
    <div className="flex-1 px-8 pb-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <SearchIcon />
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search inventory..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800/60 pl-10 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>

        <button
          onClick={() => setModal({ kind: "add" })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-cyan-400"
        >
          <PlusIcon />
          Add Item
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-800/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/80 text-xs uppercase tracking-wide text-slate-400">
              <th className="text-left font-medium px-5 py-3">Item Name</th>
              <th className="text-left font-medium px-5 py-3">Category</th>
              <th className="text-left font-medium px-5 py-3">Quantity</th>
              <th className="text-left font-medium px-5 py-3">Min Threshold</th>
              <th className="text-left font-medium px-5 py-3">Expiry Date</th>
              <th className="text-right font-medium px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm text-slate-400"
                >
                  No items match your search.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-slate-800 hover:bg-slate-800/40"
                >
                  <td className="px-5 py-4 text-slate-100">{row.name}</td>
                  <td className="px-5 py-4 text-slate-300">{row.category}</td>
                  <td className="px-5 py-4 text-slate-300">
                    {row.quantity} {row.unit}
                  </td>
                  <td className="px-5 py-4 text-slate-300">
                    {row.threshold} {row.unit}
                  </td>
                  <td className="px-5 py-4 text-slate-300">
                    {formatExpiry(row.expiry)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setModal({ kind: "edit", item: row })}
                        className="rounded-md p-1.5 text-cyan-400 hover:bg-slate-700"
                        aria-label={`Edit ${row.name}`}
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => setModal({ kind: "delete", item: row })}
                        className="rounded-md p-1.5 text-red-400 hover:bg-slate-700"
                        aria-label={`Delete ${row.name}`}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal?.kind === "add" ? (
        <ItemModal
          title="Add item"
          submitLabel="Add"
          onClose={() => setModal(null)}
          onSubmit={(data) => handleAdd(data)}
        />
      ) : null}

      {modal?.kind === "edit" ? (
        <ItemModal
          title="Edit item"
          submitLabel="Save"
          initial={modal.item}
          onClose={() => setModal(null)}
          onSubmit={(data) => handleEdit({ ...data, id: modal.item.id })}
        />
      ) : null}

      {modal?.kind === "delete" ? (
        <DeleteModal
          name={modal.item.name}
          onCancel={() => setModal(null)}
          onConfirm={() => handleDelete(modal.item.id)}
        />
      ) : null}
    </div>
  );
}

type ItemFormData = Omit<InventoryItem, "id">;

function ItemModal({
  title,
  submitLabel,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  initial?: InventoryItem;
  onClose: () => void;
  onSubmit: (data: ItemFormData) => void;
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSubmit({
      name: String(fd.get("name") ?? "").trim(),
      category: String(fd.get("category") ?? "").trim(),
      quantity: Number(fd.get("quantity") ?? 0),
      unit: String(fd.get("unit") ?? "").trim(),
      threshold: Number(fd.get("threshold") ?? 0),
      expiry: (String(fd.get("expiry") ?? "").trim() || null),
    });
  }

  return (
    <ModalShell onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="name">
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={initial?.name ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Category" htmlFor="category">
            <input
              id="category"
              name="category"
              type="text"
              required
              defaultValue={initial?.category ?? ""}
              placeholder="Groceries"
              className={inputClass}
            />
          </Field>
          <Field label="Quantity" htmlFor="quantity">
            <input
              id="quantity"
              name="quantity"
              type="number"
              min={0}
              step="any"
              required
              defaultValue={initial?.quantity ?? 0}
              className={inputClass}
            />
          </Field>
          <Field label="Unit" htmlFor="unit">
            <input
              id="unit"
              name="unit"
              type="text"
              required
              defaultValue={initial?.unit ?? ""}
              placeholder="Boxes"
              className={inputClass}
            />
          </Field>
          <Field label="Min threshold" htmlFor="threshold">
            <input
              id="threshold"
              name="threshold"
              type="number"
              min={0}
              step="any"
              required
              defaultValue={initial?.threshold ?? 0}
              className={inputClass}
            />
          </Field>
          <Field label="Expiry date" htmlFor="expiry">
            <input
              id="expiry"
              name="expiry"
              type="date"
              defaultValue={initial?.expiry ?? ""}
              className={inputClass}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-400"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function DeleteModal({
  name,
  onCancel,
  onConfirm,
}: {
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell onClose={onCancel}>
      <h2 className="text-lg font-semibold text-slate-100">Delete item</h2>
      <p className="mt-2 text-sm text-slate-300">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-slate-100">{name}</span>? This
        cannot be undone.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-slate-50 hover:bg-red-400"
        >
          Delete
        </button>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
      >
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
}

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
