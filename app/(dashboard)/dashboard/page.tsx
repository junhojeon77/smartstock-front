import { Topbar } from "@/components/layout/Topbar";
import { WasteTrendChart } from "@/components/charts/WasteTrendChart";

const kpis = [
  {
    label: "Total Financial Loss",
    value: "$12,450",
    sub: "-3.2% MoM",
    accent: "text-red-400",
    bar: "bg-red-500/20",
  },
  {
    label: "System Performance",
    value: "98.7%",
    sub: "Uptime",
    accent: "text-emerald-400",
    bar: "bg-emerald-500/20",
  },
  {
    label: "Active Users",
    value: "15",
    sub: "Active Managers",
    accent: "text-cyan-400",
    bar: "bg-cyan-500/20",
  },
];

const procurement = [
  { item: "Canned Tomatoes", suggested: "5 Boxes" },
  { item: "Olive Oil", suggested: "2 Gallons" },
  { item: "Pasta", suggested: "10 Lbs" },
];

const inventoryStatus = [
  { item: "Canned Tomatoes", stock: "30%", action: "Create PO" },
  { item: "Olive Oil", stock: "20%", action: "Create PO" },
  { item: "Pasta", stock: "60%", action: "Create PO" },
];

const orderHistory = [
  { item: "Canned Tomatoes", status: "Delivered" },
  { item: "Olive Oil", status: "Delivered" },
  { item: "Fresh Tomatoes", status: "Pending" },
];

export default function DashboardPage() {
  return (
    <>
      <Topbar title="Dashboard" />

      <div className="flex-1 px-8 pb-8 grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {kpis.map((k) => (
              <div
                key={k.label}
                className="rounded-xl border border-slate-800 bg-slate-800/60 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs text-slate-400">{k.label}</span>
                  <div className={`h-2 w-2 rounded-full ${k.bar}`} />
                </div>
                <div className={`text-3xl font-bold ${k.accent}`}>{k.value}</div>
                <div className="text-xs text-slate-400 mt-1">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-slate-200">
                Monthly Waste Trend
              </h2>
              <span className="text-xs text-slate-500">Avg Waste: 281 Lbs</span>
            </div>
            <WasteTrendChart />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-5">
              <h2 className="text-sm font-medium text-slate-200 mb-4">
                AI Procurement Recommendations
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-slate-700">
                    <th className="pb-2 text-left font-normal">Item</th>
                    <th className="pb-2 text-right font-normal">Suggested</th>
                  </tr>
                </thead>
                <tbody>
                  {procurement.map((row) => (
                    <tr key={row.item} className="border-b border-slate-800 last:border-0">
                      <td className="py-3 text-slate-200">{row.item}</td>
                      <td className="py-3 text-right text-slate-300">{row.suggested}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-5">
              <h2 className="text-sm font-medium text-slate-200 mb-4">
                Inventory Status
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-slate-700">
                    <th className="pb-2 text-left font-normal">Item</th>
                    <th className="pb-2 text-left font-normal">Stock</th>
                    <th className="pb-2 text-right font-normal">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryStatus.map((row) => (
                    <tr key={row.item} className="border-b border-slate-800 last:border-0">
                      <td className="py-3 text-slate-200">{row.item}</td>
                      <td className="py-3 text-slate-300">{row.stock}</td>
                      <td className="py-3 text-right">
                        <button className="text-xs font-medium text-cyan-400 hover:text-cyan-300">
                          {row.action}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <h2 className="text-sm font-medium text-slate-300 px-1">Alerts Center</h2>

          <div className="rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/20 to-orange-500/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-orange-300">
                Stockout Risk Warning
              </span>
            </div>
            <p className="text-sm text-slate-200 mb-4">
              Tomatoes 30% confidence level of depletion by Thursday.
            </p>
            <button className="rounded-md bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-400">
              Order Now
            </button>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Expiring Today
              </span>
            </div>
            <p className="text-sm text-slate-200 mb-4">2 Gallons Olive Oil</p>
            <button className="rounded-md border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700">
              Mark for Use
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-5">
            <h3 className="text-sm font-medium text-slate-200 mb-3">
              Recent Order History
            </h3>
            <ul className="flex flex-col gap-2 text-sm">
              {orderHistory.map((o) => (
                <li
                  key={o.item}
                  className="flex items-center justify-between text-slate-300"
                >
                  <span>{o.item}</span>
                  <span
                    className={
                      o.status === "Pending"
                        ? "text-xs text-orange-400"
                        : "text-xs text-emerald-400"
                    }
                  >
                    {o.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
