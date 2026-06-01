"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { saveAuth, normalizeRole } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

// Covers all backend response shapes:
//   Shape A/B: { token/access_token, user: { user_id, name, email, role } }
//   Shape C:   { token, name, email, role }
//   Shape D:   { token, name, role }  (email absent — fall back to form value)
type LoginResponse = {
  access_token?: string;
  token?: string;
  user?: {
    user_id?: number;
    name?: string;
    email?: string;
    role?: string;
  };
  user_id?: number;
  name?: string;
  email?: string;
  role?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const token = res.access_token ?? res.token;
      if (!token) throw new Error("No token in response");

      let user: AuthUser;
      if (res.user) {
        // Shapes A / B — nested user object
        user = {
          user_id: res.user.user_id,
          name:    res.user.name  ?? email,
          email:   res.user.email ?? email,
          role:    normalizeRole(res.user.role),
        };
      } else {
        // Shapes C / D — flat fields on root
        user = {
          user_id: res.user_id,
          name:    res.name  ?? email,
          email:   res.email ?? email,
          role:    normalizeRole(res.role),
        };
      }
      saveAuth(token, user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Glass card */}
      <div className="rounded-2xl border border-white/[0.07] bg-slate-900/70 backdrop-blur-xl shadow-2xl shadow-black/40 p-8">

        {/* Logo + heading */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 shadow-lg shadow-cyan-500/30 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="h-4 w-4">
              <path d="M20 7H4v13h16V7zM9 4h6v3H9V4zM4 12h16" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 leading-none">Smart Stock</h1>
            <p className="text-xs text-slate-500 mt-0.5">Supply chain intelligence</p>
          </div>
        </div>

        <div className="mb-7">
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-400">Sign in to your workspace.</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@restaurant.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-150"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-150"
            />
          </div>

          {/* Remember me */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              name="remember"
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/30 focus:ring-offset-slate-900"
            />
            <span className="text-sm text-slate-400">Remember me</span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-4 py-3 text-sm font-semibold text-slate-900 transition-all duration-150 hover:from-cyan-400 hover:to-cyan-300 hover:shadow-lg hover:shadow-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-slate-900" />
                Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-xs text-slate-600">OR</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        {/* Google SSO (disabled) */}
        <button
          type="button"
          disabled
          className="w-full rounded-xl border border-slate-700/60 bg-slate-800/30 px-4 py-3 text-sm font-medium text-slate-600 cursor-not-allowed flex items-center justify-center gap-2.5"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
