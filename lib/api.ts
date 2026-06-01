import { getToken } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new Error(
      "Backend unavailable — start the Flask server or check NEXT_PUBLIC_API_URL.",
    );
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json() as { error?: string; message?: string };
      message = body.error ?? body.message ?? res.statusText;
    } catch {
      // body was not JSON — keep statusText
    }
    throw new Error(`${res.status}: ${message}`);
  }

  return res.json() as Promise<T>;
}
