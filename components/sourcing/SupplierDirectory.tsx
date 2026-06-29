"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchSuppliers } from "@/lib/suppliers";
import { Card } from "@/components/ui/Card";
import type { Supplier } from "@/types/index";

/** Two-letter avatar from a supplier name, e.g. "Fresh Valley" -> "FV". */
function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  const letters = (words[0]?.[0] ?? "") + (words[1]?.[0] ?? "");
  return letters.toUpperCase() || "?";
}

/**
 * Supplier Directory. Lists the supplier registry (GET /api/suppliers) as
 * cards with a client-side search. Only the fields the backend stores —
 * name, contact, location — are shown; the mockup's rating/status/lead-time
 * badges need data the API doesn't expose yet.
 */
export function SupplierDirectory() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSuppliers()
      .then((s) => !cancelled && setSuppliers(s))
      .catch(
        (e) =>
          !cancelled &&
          setError(e instanceof Error ? e.message : "Could not load suppliers."),
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) =>
        s.supplier_name.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.contact_info.toLowerCase().includes(q),
    );
  }, [suppliers, query]);

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            Supplier Directory
          </h2>
          <p className="text-sm text-slate-500">
            {suppliers.length} registered supplier
            {suppliers.length === 1 ? "" : "s"}.
          </p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search suppliers…"
          className="w-full rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 sm:w-64"
        />
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {loading && (
        <p className="mt-4 text-sm text-slate-500">Loading suppliers…</p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          {suppliers.length === 0
            ? "No suppliers registered yet."
            : "No suppliers match your search."}
        </p>
      )}

      {filtered.length > 0 && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {filtered.map((s) => (
            <div
              key={s.supplier_id}
              className="rounded-lg border border-slate-800/70 bg-slate-900/40 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-sm font-semibold text-cyan-400">
                  {initials(s.supplier_name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-100">
                    {s.supplier_name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {s.location || "Location not set"}
                  </p>
                </div>
              </div>
              <p className="mt-3 truncate text-sm text-slate-400">
                {s.contact_info || "No contact on file"}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
