"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getUser, normalizeRole } from "@/lib/auth";
import type { Role } from "@/lib/auth";

type RoleGuardProps = {
  /** Roles permitted to view the wrapped content. */
  allow: Role[];
  children: ReactNode;
  /** Where to send users whose role is not allowed. */
  redirectTo?: string;
};

/**
 * Client-side role gate for protected routes. Assumes authentication has
 * already been enforced by the dashboard layout; this adds the role layer on
 * top so that, e.g., only Admins can reach the account-management page even via
 * a direct URL.
 */
export function RoleGuard({
  allow,
  children,
  redirectTo = "/dashboard",
}: RoleGuardProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const role = normalizeRole(getUser()?.role);
    if (allow.includes(role)) {
      setAllowed(true);
    } else {
      setAllowed(false);
      router.replace(redirectTo);
    }
    // allow is a stable literal per usage site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, redirectTo]);

  if (allowed === null) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-800 border-t-cyan-400" />
          <span className="text-sm text-slate-600">Checking access…</span>
        </div>
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
