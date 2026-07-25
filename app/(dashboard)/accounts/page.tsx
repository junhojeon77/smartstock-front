"use client";

import { useCallback, useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/auth";
import type { Role } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

type ManagedUser = {
  user_id?: number;
  name: string;
  email: string;
  role: string;
};

// ─── Form state ───────────────────────────────────────────────────────────────

type FormValues = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

const EMPTY_FORM: FormValues = {
  name: "",
  email: "",
  password: "",
  role: "Employee",
};

const ROLES: { value: Role; description: string }[] = [
  { value: "Owner", description: "Top-level access — can manage accounts and oversee everything." },
  { value: "Admin", description: "Full access — can manage inventory." },
  { value: "Manager", description: "Can add, edit, and order inventory." },
  { value: "Employee", description: "Read-only view of inventory and alerts." },
];

const ROLE_BADGE: Record<string, string> = {
  Owner: "bg-violet-500/10 text-violet-300 border-violet-500/25",
  Admin: "bg-cyan-500/10 text-cyan-300 border-cyan-500/25",
  Manager: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  Employee: "bg-slate-500/10 text-slate-300 border-slate-500/25",
};

const inputCls =
  "w-full rounded-xl border border-slate-700/60 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-150 disabled:opacity-50";

// ─── Create form ──────────────────────────────────────────────────────────────

function CreateAccountForm({ onCreated }: { onCreated: () => void }) {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleField(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await apiFetch<{ message: string }>("/api/users", {
        method: "POST",
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
        }),
      });
      setSuccess(`Account for ${values.name} (${values.role}) created.`);
      setValues(EMPTY_FORM);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 backdrop-blur-sm p-6">
      <h2 className="text-sm font-semibold text-slate-100 mb-1">Create a new account</h2>
      <p className="text-xs text-slate-500 mb-5">
        Provision access for a team member. They can sign in immediately with these credentials.
      </p>

      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 mt-0.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Full Name
          </label>
          <input
            name="name"
            type="text"
            required
            value={values.name}
            onChange={handleField}
            placeholder="e.g. Alex Smith"
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            value={values.email}
            onChange={handleField}
            placeholder="e.g. alex@smartstock.com"
            autoComplete="off"
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Temporary Password
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            value={values.password}
            onChange={handleField}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Role
          </label>
          <select
            name="role"
            value={values.role}
            onChange={handleField}
            className={inputCls}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.value}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-600">
            {ROLES.find((r) => r.value === values.role)?.description}
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-cyan-400 active:scale-[0.98] transition-all duration-150 shadow-sm shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-600 border-t-slate-900" />
              Creating…
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>
    </div>
  );
}

// ─── Accounts list ────────────────────────────────────────────────────────────

function AccountsList({
  users,
  loading,
  error,
  currentEmail,
  onDelete,
}: {
  users: ManagedUser[];
  loading: boolean;
  error: string | null;
  currentEmail: string | null;
  onDelete: (user: ManagedUser) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 backdrop-blur-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
        <h2 className="text-sm font-semibold text-slate-100">Existing accounts</h2>
        <span className="text-xs text-slate-500">{users.length} total</span>
      </div>

      {error && (
        <div className="m-4 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-800 border-t-cyan-400" />
          Loading accounts…
        </div>
      ) : users.length === 0 && !error ? (
        <div className="py-12 text-center text-sm text-slate-600">No accounts found.</div>
      ) : (
        <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-800/60 bg-slate-900">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = currentEmail != null && u.email === currentEmail;
                return (
                  <tr key={u.email} className="border-t border-slate-800/50 hover:bg-slate-800/25 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-100">
                      {u.name}
                      {isSelf && <span className="ml-2 text-xs text-slate-500">(you)</span>}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[u.role] ?? ROLE_BADGE.Employee}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end">
                        {isSelf ? (
                          <span className="text-xs text-slate-700 px-2">—</span>
                        ) : (
                          <button
                            onClick={() => onDelete(u)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
                            aria-label={`Delete ${u.name}`}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

function ManageAccounts() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ManagedUser[]>("/api/users");
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentEmail(getUser()?.email ?? null);
    loadUsers();
  }, [loadUsers]);

  async function handleDelete(user: ManagedUser) {
    if (!window.confirm(`Delete the account for ${user.name} (${user.email})? This cannot be undone.`)) {
      return;
    }
    setError(null);
    try {
      await apiFetch<{ message: string }>(`/api/users/${encodeURIComponent(user.email)}`, {
        method: "DELETE",
      });
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
    }
  }

  return (
    <>
      <Topbar title="Manage Accounts" />
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <CreateAccountForm onCreated={loadUsers} />
        </div>
        <div className="lg:col-span-3">
          <AccountsList
            users={users}
            loading={loading}
            error={error}
            currentEmail={currentEmail}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </>
  );
}

export default function AccountsPage() {
  return (
    <RoleGuard allow={["Owner"]}>
      <ManageAccounts />
    </RoleGuard>
  );
}
