"use client";

import { WasteTrendChart } from "@/components/charts/WasteTrendChart";

// Template weekly history — a real /api/history endpoint would replace this.
const WEEKLY = [
  { week: "Week 1", sold: 120, wasted: 8 },
  { week: "Week 2", sold: 135, wasted: 11 },
  { week: "Week 3", sold: 128, wasted: 6 },
  { week: "Week 4", sold: 142, wasted: 9 },
  { week: "Week 5", sold: 150, wasted: 14 },
  { week: "Week 6", sold: 138, wasted: 7 },
];

const card = "rounded-xl border border-slate-800/70 bg-slate-900/40 backdrop-blur-sm p-5";

/**
 * Historical Trends tab. Demand/waste trend visualisations. Uses template
 * weekly data until a backend history endpoint is exposed.
 */
export function HistoricalTrendsTab() {
  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <div className={card}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">
            Demand & Waste Trend
          </h2>
          <span className="rounded-full border border-slate-700/60 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-500">
            Template data
          </span>
        </div>
        <WasteTrendChart />
      </div>

      <div className={card}>
        <h2 className="mb-4 text-sm font-semibold text-slate-200">
          Weekly Sales History
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800/60 text-xs text-slate-600">
              <th className="pb-2.5 text-left font-medium">Period</th>
              <th className="pb-2.5 text-right font-medium">Sold</th>
              <th className="pb-2.5 text-right font-medium">Wasted</th>
              <th className="pb-2.5 text-right font-medium">Waste %</th>
            </tr>
          </thead>
          <tbody>
            {WEEKLY.map((row) => (
              <tr
                key={row.week}
                className="border-b border-slate-800/40 last:border-0"
              >
                <td className="py-3 text-slate-300">{row.week}</td>
                <td className="py-3 text-right tabular-nums text-slate-400">
                  {row.sold}
                </td>
                <td className="py-3 text-right tabular-nums text-slate-400">
                  {row.wasted}
                </td>
                <td className="py-3 text-right tabular-nums text-amber-400">
                  {Math.round((row.wasted / row.sold) * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
