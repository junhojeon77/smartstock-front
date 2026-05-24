"use server";

import { redirect } from "next/navigation";
import { authenticate, clearSession, setSession } from "./auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const user = authenticate(email, password);
  if (!user) {
    return { error: "Invalid email or password." };
  }

  setSession(user);
  redirect(user.role === "Admin" ? "/dashboard" : "/inventory");
}

export async function logoutAction(): Promise<void> {
  clearSession();
  redirect("/login");
}
