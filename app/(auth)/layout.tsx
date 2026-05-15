import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      <header className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500" />
          <span className="text-lg font-semibold text-slate-100">Smart Stock</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        {children}
      </main>
    </div>
  );
}
