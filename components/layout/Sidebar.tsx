"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { clearAuth, getUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
};

const nav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    ),
  },
  {
    label: "Inventory",
    href: "/inventory",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M20 7H4v13h16V7zM9 4h6v3H9V4zM4 12h16" />
      </svg>
    ),
  },
  {
    label: "AI Assistant",
    href: "/assistant",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M12 2a4 4 0 014 4v1h1a3 3 0 013 3v2a3 3 0 01-3 3h-1v1a4 4 0 01-4 4 4 4 0 01-4-4v-1H7a3 3 0 01-3-3v-2a3 3 0 013-3h1V6a4 4 0 014-4z" />
        <circle cx="9" cy="12" r="1" fill="currentColor" />
        <circle cx="15" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Smart Sourcing",
    href: "/sourcing",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M3 3h2l2 12h11l2-8H7M9 21a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
      </svg>
    ),
  },
  {
    label: "Reports",
    href: "/reports",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M9 13h6M9 17h6" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  function handleSignOut() {
    clearAuth();
    router.push("/login");
  }

  const items = nav.filter(
    (item) => !item.adminOnly || user?.role === "Admin",
  );

  return (
    <aside className="w-60 shrink-0 border-r border-slate-800 bg-slate-950/80 px-4 py-6 flex flex-col">
      <Link href="/dashboard" className="flex items-center gap-2 px-2 mb-8">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500" />
        <span className="font-semibold text-slate-100">Smart Stock</span>
      </Link>

      <nav className="flex flex-col gap-1 flex-1">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
              )}
            >
              <span className={cn(active ? "text-cyan-400" : "text-slate-400")}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="mt-4 border-t border-slate-800 pt-4">
          <div className="flex items-center gap-3 px-2 pb-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-sm font-semibold text-slate-900">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-100">
                {user.name}
              </div>
              <div className="text-xs text-slate-400">{user.role}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-700 hover:bg-slate-800/60 hover:text-slate-100"
          >
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
