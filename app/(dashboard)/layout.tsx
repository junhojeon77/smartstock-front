"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { isAuthenticated, getUser, normalizeRole } from "@/lib/auth";

// Owners only get account management + the AI assistant.
const OWNER_ALLOWED = ["/accounts", "/assistant"];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    // Keep Owners out of operational pages, even via direct URL.
    if (normalizeRole(getUser()?.role) === "Owner") {
      const allowed = OWNER_ALLOWED.some(
        (p) => pathname === p || pathname?.startsWith(p + "/"),
      );
      if (!allowed) {
        router.replace("/accounts");
        return;
      }
    }

    setChecking(false);
  }, [router, pathname]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-800 border-t-cyan-400" />
          <span className="text-sm text-slate-600">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Mobile backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile-only top navigation bar */}
        <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-lg px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors focus:outline-none"
            aria-label="Open navigation"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M4 6h16M4 12h16M4 18h10" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-cyan-400 to-teal-500" />
            <span className="text-sm font-semibold text-slate-100 tracking-tight">
              Smart Stock
            </span>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
