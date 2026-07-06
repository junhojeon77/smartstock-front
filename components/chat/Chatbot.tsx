"use client";

import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "@/lib/chat";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { ChatMessage } from "@/types/index";

const SUGGESTIONS = [
  "Which items are running low?",
  "What's expiring soon?",
  "Who's the cheapest supplier for Olive Oil?",
];

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! Ask me about stock levels, expiry dates, suppliers, sales trends, or waste.",
};

let counter = 0;
const nextId = () => `msg-${counter++}`;

/**
 * AI chatbot. Sends user messages to the backend /api/chat endpoint (a
 * rule-based intent layer over live inventory data, with a model fallback)
 * via sendChatMessage, which falls back to an "unavailable" message if the
 * backend can't be reached.
 */
export function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending) return;

    const userMsg: ChatMessage = { id: nextId(), role: "user", content };
    const pendingId = nextId();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: pendingId, role: "assistant", content: "…", pending: true },
    ]);
    setInput("");
    setSending(true);

    const reply = await sendChatMessage(content);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === pendingId ? { ...m, content: reply, pending: false } : m,
      ),
    );
    setSending(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void send(input);
  }

  return (
    <Card className="flex h-[32rem] flex-col">
      <div className="border-b border-slate-800/70 px-5 py-3">
        <h2 className="text-lg font-semibold text-slate-100">AI Assistant</h2>
        <p className="text-xs text-slate-500">
          Answers from your live inventory, suppliers, and sales history.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                m.role === "user"
                  ? "bg-cyan-500 text-ink"
                  : "border border-slate-800/70 bg-slate-900/60 text-slate-200"
              } ${m.pending ? "animate-pulse" : ""}`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="flex flex-wrap gap-2 px-5 pb-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => void send(s)}
            disabled={sending}
            className="rounded-full border border-slate-700/70 bg-slate-900/40 px-3 py-1 text-xs text-slate-400 transition-colors hover:border-cyan-500/50 hover:text-cyan-400 disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-slate-800/70 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your inventory…"
          className="flex-1 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
        />  
        <Button type="submit" disabled={sending || input.trim() === ""}>
          Send
        </Button>
      </form>
    </Card>
  );
}
