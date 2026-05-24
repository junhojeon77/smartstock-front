"use server";

import { revalidatePath } from "next/cache";
import { addUser, getSession } from "@/lib/auth";
import type { Role } from "@/lib/session";

export type CreateUserState = { error?: string; ok?: boolean };

export async function createUserAction(
  _prev: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const session = getSession();
  if (!session || session.role !== "Admin") {
    return { error: "Unauthorized." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const roleInput = String(formData.get("role") ?? "Employee");
  const role: Role = roleInput === "Admin" ? "Admin" : "Employee";

  if (!name || !email || !password) {
    return { error: "Name, email, and password are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  try {
    addUser({ name, email, password, role });
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidatePath("/users");
  return { ok: true };
}
