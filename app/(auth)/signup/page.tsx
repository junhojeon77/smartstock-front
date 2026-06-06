"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { saveAuth, normalizeRole } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

// Mirrors the shapes handled by the login page:
//   { token/access_token, user: { user_id, name, email, role } }
//   { token, user_id?, name, email, role }
// Some backends return 201 with no token — in that case we send the user to
// the login page instead of auto-signing-in.
type RegisterResponse = {
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

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch<RegisterResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      const token = res.access_token ?? res.token;

      if (token) {
        // Backend signed us in directly — persist and head to the dashboard.
        const src = res.user ?? res;
        const user: AuthUser = {
          user_id: src.user_id,
          name: src.name ?? name,
          email: src.email ?? email,
          role: normalizeRole(src.role),
        };
        saveAuth(token, user);
        router.push("/dashboard");
      } else {
        // Account created but no session returned — go to login.
        router.push("/login?registered=1");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-150";
  const labelClass =
    "text-xs font-semibold text-slate-400 uppercase tracking-wider";

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
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Create your account</h2>
          <p className="mt-1 text-sm text-slate-400">Get started with your workspace.</p>
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
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className={labelClass}>
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Jane Doe"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className={labelClass}>
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
              className={inputClass}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Confirm password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm" className={labelClass}>
              Confirm password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-4 py-3 text-sm font-semibold text-slate-900 transition-all duration-150 hover:from-cyan-400 hover:to-cyan-300 hover:shadow-lg hover:shadow-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-slate-900" />
                Creating account…
              </span>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        {/* Sign in link */}
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-cyan-500 hover:text-cyan-400 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
