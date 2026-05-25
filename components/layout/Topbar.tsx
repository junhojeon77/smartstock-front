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
    <header className="flex items-center justify-between px-8 py-6">
      <h1 className="text-2xl font-semibold text-slate-100">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-xs text-slate-400">Welcome,</div>
          <div className="text-sm font-medium text-slate-200">{displayRole}</div>
        </div>
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-sm font-medium text-slate-900">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <button
          onClick={handleSignOut}
          className="ml-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
