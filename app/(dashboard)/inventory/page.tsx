import { Topbar } from "@/components/layout/Topbar";

type Row = {
  name: string;
  category: string;
  quantity: string;
  threshold: string;
  expiry: string;
};

const rows: Row[] = [
  {
    name: "Canned Tomatoes",
    category: "Groceries",
    quantity: "250 Boxes",
    threshold: "50 Boxes",
    expiry: "Jun 01, 2025",
  },
  {
    name: "Olive Oil (Gallons)",
    category: "Liquids",
    quantity: "45 Gallons",
    threshold: "10 Gallons",
    expiry: "Oct 15, 2024",
  },
  {
    name: "Dry Pasta (Lbs)",
    category: "Groceries",
    quantity: "500 Lbs",
    threshold: "100 Lbs",
    expiry: "Jan 01, 2026",
  },
  {
    name: "Paper Plates",
    category: "Supplies",
    quantity: "1000 Units",
    threshold: "200 Units",
    expiry: "N/A",
  },
  {
    name: "Cardboard Boxes",
    category: "Supplies",
    quantity: "300 units",
    threshold: "100 units",
    expiry: "N/A",
  },
];

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

export default function InventoryPage() {
  return (
    <>
      <Topbar title="Inventory Overview" />

      <div className="flex-1 px-8 pb-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </div>
            <input
              type="search"
              placeholder="Search inventory..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 pl-10 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <button className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-cyan-400">
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
              {rows.map((row) => (
                <tr
                  key={row.name}
                  className="border-t border-slate-800 hover:bg-slate-800/40"
                >
                  <td className="px-5 py-4 text-slate-100">{row.name}</td>
                  <td className="px-5 py-4 text-slate-300">{row.category}</td>
                  <td className="px-5 py-4 text-slate-300">{row.quantity}</td>
                  <td className="px-5 py-4 text-slate-300">{row.threshold}</td>
                  <td className="px-5 py-4 text-slate-300">{row.expiry}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="rounded-md p-1.5 text-cyan-400 hover:bg-slate-700"
                        aria-label={`Edit ${row.name}`}
                      >
                        <EditIcon />
                      </button>
                      <button
                        className="rounded-md p-1.5 text-red-400 hover:bg-slate-700"
                        aria-label={`Delete ${row.name}`}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
