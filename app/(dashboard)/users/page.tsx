import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { getSession, listUsers } from "@/lib/auth";
import { CreateUserForm } from "./CreateUserForm";

export default function UsersPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "Admin") redirect("/dashboard");

  const users = listUsers();

  return (
    <>
      <Topbar title="User Management" />

      <div className="flex-1 px-8 pb-8 space-y-6">
        <CreateUserForm />

        <div className="rounded-xl border border-slate-800 bg-slate-800/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-100">
              Existing accounts
            </h2>
            <p className="text-xs text-slate-400">
              {users.length} {users.length === 1 ? "user" : "users"} total
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/80 text-xs uppercase tracking-wide text-slate-400">
                <th className="text-left font-medium px-5 py-3">Name</th>
                <th className="text-left font-medium px-5 py-3">Email</th>
                <th className="text-left font-medium px-5 py-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-slate-800 hover:bg-slate-800/40"
                >
                  <td className="px-5 py-4 text-slate-100">{u.name}</td>
                  <td className="px-5 py-4 text-slate-300">{u.email}</td>
                  <td className="px-5 py-4">
                    <span
                      className={
                        u.role === "Admin"
                          ? "inline-flex rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300 ring-1 ring-cyan-500/30"
                          : "inline-flex rounded-full bg-slate-700/40 px-2.5 py-0.5 text-xs font-medium text-slate-300 ring-1 ring-slate-600/40"
                      }
                    >
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
