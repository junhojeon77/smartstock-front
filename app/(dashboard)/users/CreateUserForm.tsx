"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createUserAction, type CreateUserState } from "./actions";

const initialState: CreateUserState = {};

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20";

export function CreateUserForm() {
  const [state, formAction] = useFormState(createUserAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-xl border border-slate-800 bg-slate-800/60 p-6"
    >
      <h2 className="text-lg font-semibold text-slate-100">Create user</h2>
      <p className="mt-1 text-sm text-slate-400">
        New accounts are provisioned by administrators.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name">
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Jane Doe"
            className={inputClass}
          />
        </Field>

        <Field label="Email" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="jane@restaurant.com"
            autoComplete="off"
            className={inputClass}
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Min. 6 characters"
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>

        <Field label="Role" htmlFor="role">
          <select
            id="role"
            name="role"
            defaultValue="Employee"
            className={inputClass}
          >
            <option value="Employee">Employee</option>
            <option value="Admin">Admin</option>
          </select>
        </Field>
      </div>

      {state.error ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300"
        >
          {state.error}
        </p>
      ) : null}

      {state.ok ? (
        <p
          role="status"
          className="mt-4 rounded-md border border-emerald-900/60 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300"
        >
          User created.
        </p>
      ) : null}

      <div className="mt-5 flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-500/60"
    >
      {pending ? "Creating…" : "Create user"}
    </button>
  );
}
