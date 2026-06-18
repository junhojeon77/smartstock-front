"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { clearAuth, getUser, normalizeRole } from "@/lib/auth";
import type { AuthUser, Role } from "@/lib/auth";

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  /** When set, only these roles see the item. Omit for everyone. */
  roles?: Role[];
};

// Operational pages — everyone except Owner (Owner only manages accounts).
const OPERATIONAL: Role[] = ["Admin", "Manager", "Employee"];

const nav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    roles: OPERATIONAL,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Inventory",
    href: "/inventory",
    roles: OPERATIONAL,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <path d="M20 7H4v13h16V7zM9 4h6v3H9V4zM4 12h16" />
      </svg>
    ),
  },
  {
    label: "AI Assistant",
    href: "/assistant",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <path d="M12 2a4 4 0 014 4v1h1a3 3 0 013 3v2a3 3 0 01-3 3h-1v1a4 4 0 01-8 0v-1H7a3 3 0 01-3-3v-2a3 3 0 013-3h1V6a4 4 0 014-4z" />
        <circle cx="9" cy="12" r="1" fill="currentColor" />
        <circle cx="15" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Smart Sourcing",
    href: "/sourcing",
    roles: OPERATIONAL,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <path d="M3 3h2l2 12h11l2-8H7M9 21a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z" />
      </svg>
    ),
  },
  {
    label: "Reports",
    href: "/reports",
    roles: OPERATIONAL,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M9 13h6M9 17h6" />
      </svg>
    ),
  },
  {
    label: "Manage Accounts",
    href: "/accounts",
    roles: ["Owner"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6M22 11h-6" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    roles: OPERATIONAL,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
      </svg>
    ),
  },
];

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
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
    (item) => !item.roles || item.roles.includes(normalizeRole(user?.role)),
  );

  return (
    <aside
      className={cn(
        "w-64 shrink-0 flex flex-col border-r border-slate-800/60 bg-slate-950",
        "fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-out",
        "lg:relative lg:inset-auto lg:z-auto lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-800/50">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2.5 group"
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 shadow-lg shadow-cyan-500/20 transition-transform duration-150 group-hover:scale-105" />
          <span className="font-semibold text-slate-100 tracking-tight">
            Smart Stock
          </span>
        </Link>

        <button
          onClick={onClose}
          className="lg:hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
          aria-label="Close menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1 overflow-y-auto">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href + "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-gradient-to-r from-cyan-500/[0.12] to-teal-500/[0.06] text-cyan-300 border border-cyan-500/20"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent",
              )}
            >
              <span
                className={cn(
                  "transition-colors",
                  active ? "text-cyan-400" : "text-slate-500",
                )}
              >
                {item.icon}
              </span>
              {item.label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
              )}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="px-4 py-4 border-t border-slate-800/50">
          <div className="flex items-center gap-3 pb-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-sm font-semibold text-ink">
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

          <p className="mt-4 text-xs text-slate-600">Smart Stock © 2025</p>
        </div>
      )}
    </aside>
  );
}