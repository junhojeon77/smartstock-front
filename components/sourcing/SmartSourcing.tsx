"use client";

import { useState } from "react";
import { PriceComparison } from "@/components/sourcing/PriceComparison";
import { SupplierDirectory } from "@/components/sourcing/SupplierDirectory";
import { Card } from "@/components/ui/Card";

const TABS = ["Supplier Comparison", "Price History", "Supplier Directory"] as const;
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
      {tab === "Price History" && (
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-100">Price History</h2>
          <p className="mt-1 text-sm text-slate-500">
            Price trends over time.
          </p>
          {/* ponytail: needs a backend endpoint that returns historical prices.
              The current API stores only one current price + timestamp per
              offer, so there is no real series to chart yet. */}
          <p className="mt-6 rounded-lg border border-slate-800/70 bg-slate-900/40 p-4 text-sm text-slate-400">
            Historical price trends aren&apos;t available yet — the backend
            currently stores only each supplier&apos;s latest price. Add a
            prices-over-time endpoint to chart this tab.
          </p>
        </Card>
      )}
    </div>
  );
}
