export type Role = "Admin" | "Employee";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export const SESSION_COOKIE = "smartstock_session";

function toBase64(input: string): string {
  if (typeof btoa === "function") {
    return btoa(unescape(encodeURIComponent(input)));
  }
  return Buffer.from(input, "utf8").toString("base64");
}

function fromBase64(input: string): string {
  if (typeof atob === "function") {
    return decodeURIComponent(escape(atob(input)));
  }
  return Buffer.from(input, "base64").toString("utf8");
}

export function encodeSession(user: SessionUser): string {
  return toBase64(JSON.stringify(user));
}

export function decodeSession(raw: string | undefined | null): SessionUser | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(fromBase64(raw));
    if (
      parsed &&
      typeof parsed.id === "string" &&
      typeof parsed.name === "string" &&
      typeof parsed.email === "string" &&
      (parsed.role === "Admin" || parsed.role === "Employee")
    ) {
      return parsed as SessionUser;
    }
  } catch {
    // fall through
  }
  return null;
}
