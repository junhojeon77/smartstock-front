export type AuthUser = {
  user_id?: number;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Employee" | string;
};

const TOKEN_KEY = "smartstock_token";
const USER_KEY = "smartstock_user";

export function saveAuth(token: string, user: AuthUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

export function normalizeRole(role: string | undefined | null): "Admin" | "Manager" | "Employee" {
  switch ((role ?? "").toLowerCase().trim()) {
    case "admin":   return "Admin";
    case "manager": return "Manager";
    default:        return "Employee";
  }
}
