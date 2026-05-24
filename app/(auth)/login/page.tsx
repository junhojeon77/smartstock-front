import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-800/60 p-8 shadow-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-400">
          Sign in to your Smart Stock account.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
