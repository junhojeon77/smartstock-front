export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r p-4">
        {/* TODO: sidebar navigation */}
        <div className="font-bold">Smart Stock</div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
