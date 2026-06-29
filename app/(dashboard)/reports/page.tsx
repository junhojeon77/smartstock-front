import { Topbar } from "@/components/layout/Topbar";

export default function ReportsPage() {
  return (
    <>
      <Topbar title="Reports" />
      <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-8 pt-6">
        <p className="text-slate-500">View and analyze your procurement data.</p>
      </div>
    </>
  );
}
