import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { getSession } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = getSession();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}
