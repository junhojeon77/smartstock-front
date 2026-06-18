import { apiFetch } from "@/lib/api";
import type { ChatResponse } from "@/types/index";

/**
 * AI assistant chat client (template / mock phase).
 *
 * This talks to the backend POST /api/chat endpoint, which is currently a mock
 * that echoes the query back (a real local model is planned there later). To
 * keep the page demoable even when the backend is offline, we fall back to a
 * deterministic canned reply rather than surfacing a transport error in the
 * chat thread.
 */

/** Canned, offline reply used when the backend chat endpoint is unreachable. */
export function mockReply(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return "Ask me about stock levels, demand forecasts, or reorder timing.";
  }
  return `(demo) I received: "${trimmed}". Once the AI model is connected, I'll answer procurement questions using your live inventory and sales history.`;
}

/**
 * Send a user message to the assistant and return the reply text. Never throws:
 * a backend/transport failure resolves to a mock reply so the chat UI keeps
 * working in the template phase.
 */
export async function sendChatMessage(message: string): Promise<string> {
  try {
    const res = await apiFetch<ChatResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
    return typeof res?.response === "string" && res.response.length > 0
      ? res.response
      : mockReply(message);
  } catch {
    return mockReply(message);
  }
}
