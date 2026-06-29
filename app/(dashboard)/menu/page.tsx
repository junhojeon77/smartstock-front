import { Topbar } from "@/components/layout/Topbar";

export default function MenuPage() {
  return (
    <>
      <Topbar title="Menu" />
      <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-8 pt-6">
        <p className="text-slate-500">Menu items and their ingredient recipes.</p>
      </div>
    </>
  );
}
