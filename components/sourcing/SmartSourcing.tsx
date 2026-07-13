"use client";

import { useState } from "react";
import { PriceComparison } from "@/components/sourcing/PriceComparison";
import { SupplierDirectory } from "@/components/sourcing/SupplierDirectory";

const TABS = ["Supplier Comparison", "Supplier Directory"] as const;
type Tab = (typeof TABS)[number];

/** Tabbed Smart Sourcing view. Comparison and Directory run on real API data. */
export function SmartSourcing() {
  const [tab, setTab] = useState<Tab>("Supplier Comparison");

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-slate-800/70">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Supplier Comparison" && <PriceComparison />}
      {tab === "Supplier Directory" && <SupplierDirectory />}
    </div>
  );
}
