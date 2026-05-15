import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-800/60 p-8 shadow-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-400">
          Sign in to your Smart Stock account.
        </p>
      </div>

      <form className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-slate-300">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@restaurant.com"
            autoComplete="email"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-slate-300">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
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
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            name="remember"
            className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500/30"
          />
          Remember me
        </label>

        <button
          type="submit"
          className="mt-2 w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
        >
          Sign in
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-slate-500">
        <div className="h-px flex-1 bg-slate-700" />
        OR
        <div className="h-px flex-1 bg-slate-700" />
      </div>

      <button
        type="button"
        className="w-full rounded-lg border border-slate-700 bg-slate-900/40 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
      >
        Continue with Google
      </button>
    </div>
  );
}
