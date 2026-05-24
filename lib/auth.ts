import "server-only";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  decodeSession,
  encodeSession,
  type Role,
  type SessionUser,
} from "./session";

type MockUser = SessionUser & { password: string };

// In-memory mock store. Resets on dev-server restart.
// The real persistence layer will live in smartstock-back.
const users: MockUser[] = [
  {
    id: "1",
    name: "Jun Ho Jeon",
    email: "admin@smartstock.com",
    password: "admin123",
    role: "Admin",
  },
  {
    id: "2",
    name: "Jun Ho Jeon",
    email: "employee@smartstock.com",
    password: "employee123",
    role: "Employee",
  },
];

export function listUsers(): SessionUser[] {
  return users.map(({ password: _pw, ...rest }) => rest);
}

export function addUser(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
}): SessionUser {
  const existing = users.find(
    (u) => u.email.toLowerCase() === input.email.toLowerCase(),
  );
  if (existing) {
    throw new Error("A user with that email already exists.");
  }
  const created: MockUser = { id: String(users.length + 1), ...input };
  users.push(created);
  const { password: _pw, ...rest } = created;
  return rest;
}

export function authenticate(email: string, password: string): SessionUser | null {
  const match = users.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );
  if (!match) return null;
  const { password: _pw, ...rest } = match;
  return rest;
}

export function getSession(): SessionUser | null {
  return decodeSession(cookies().get(SESSION_COOKIE)?.value);
}

export function setSession(user: SessionUser): void {
  cookies().set(SESSION_COOKIE, encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSession(): void {
  cookies().delete(SESSION_COOKIE);
}
