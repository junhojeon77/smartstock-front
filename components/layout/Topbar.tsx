import { getSession } from "@/lib/auth";

type TopbarProps = {
  title: string;
};

export function Topbar({ title }: TopbarProps) {
  const session = getSession();
  const name = session?.name ?? "Guest";
  const role = session?.role ?? "Guest";

  return (
    <header className="flex items-center justify-between px-8 py-6">
      <h1 className="text-2xl font-semibold text-slate-100">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-xs text-slate-400">Welcome,</div>
          <div className="text-sm font-medium text-slate-200">{role}</div>
        </div>
        <div
          className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-sm font-medium text-slate-900"
          title={name}
        >
          {name.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
