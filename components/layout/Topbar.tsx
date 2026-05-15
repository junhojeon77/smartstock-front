type TopbarProps = {
  title: string;
  userName?: string;
  role?: string;
};

export function Topbar({ title, userName = "Manager", role = "Manager" }: TopbarProps) {
  return (
    <header className="flex items-center justify-between px-8 py-6">
      <h1 className="text-2xl font-semibold text-slate-100">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-xs text-slate-400">Welcome,</div>
          <div className="text-sm font-medium text-slate-200">{role}</div>
        </div>
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-sm font-medium text-slate-900">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
