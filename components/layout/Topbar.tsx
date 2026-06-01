"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, clearAuth } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

type TopbarProps = {
  title: string;
};

export function Topbar({ title }: TopbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  function handleSignOut() {
    clearAuth();
    router.push("/login");
  }

  const displayName = user?.name ?? "User";
  const displayRole = user?.role ?? "";

  return (
    <header className="sticky top-14 lg:top-0 z-10 flex items-center justify-between px-5 lg:px-8 py-4 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-lg">
      <h1 className="text-lg lg:text-xl font-semibold text-slate-100 tracking-tight truncate">
        {title}
      </h1>

      <div className="flex items-center gap-2 sm:gap-3 ml-4 shrink-0">
        {/* Name + role (hidden on very small screens) */}
        <div className="hidden sm:block text-right leading-none">
          <div className="text-[11px] text-slate-500 mb-0.5">Signed in</div>
          <div className="text-xs font-medium text-slate-300 truncate max-w-[120px]">
            {displayName}
          </div>
        </div>

        {/* Avatar with role badge */}
        <div className="relative">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-xs font-bold text-slate-900 ring-2 ring-slate-800/80 shadow-md">
            {displayName.charAt(0).toUpperCase()}
          </div>
          {displayRole && (
            <div className="absolute -bottom-1 -right-1 rounded-full bg-slate-900 border border-slate-700/80 px-1 py-px text-[9px] font-semibold text-cyan-400 leading-none">
              {displayRole.slice(0, 1)}
            </div>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="rounded-lg border border-slate-700/60 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-600 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/30"
        >
          <span className="hidden sm:inline">Sign out</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 sm:hidden">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>
    </header>
  );
}
