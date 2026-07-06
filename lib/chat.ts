import { apiFetch } from "@/lib/api";
import type { ChatResponse } from "@/types/index";

/** Shown when the assistant endpoint can't be reached (network/backend down). */
export const UNAVAILABLE_MESSAGE =
  "Couldn't reach the assistant right now. Try again in a moment.";

/**
 * Send a user message to the AI assistant — POST /api/chat, a rule-based
 * intent layer over live inventory/supplier/sales data with a TF-IDF fallback
 * model (see backend chatbot.py). Never throws: a transport failure resolves
 * to UNAVAILABLE_MESSAGE so the chat thread always gets a reply.
 */
export async function sendChatMessage(message: string): Promise<string> {
  try {
    const res = await apiFetch<ChatResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
    return typeof res?.response === "string" && res.response.length > 0
      ? res.response
      : UNAVAILABLE_MESSAGE;
  } catch {
    return UNAVAILABLE_MESSAGE;
  }
}
