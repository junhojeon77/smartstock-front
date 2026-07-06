import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));
import { apiFetch } from "@/lib/api";
import { sendChatMessage, UNAVAILABLE_MESSAGE } from "@/lib/chat";

describe("sendChatMessage", () => {
  it("returns the backend's reply text", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      response: "3 item(s) at or below threshold: Olive Oil.",
      source: "rules",
    });
    expect(await sendChatMessage("what's running low?")).toBe(
      "3 item(s) at or below threshold: Olive Oil.",
    );
  });

  it("falls back to the unavailable message on transport failure", async () => {
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error("network down"));
    expect(await sendChatMessage("hello")).toBe(UNAVAILABLE_MESSAGE);
  });

  it("falls back to the unavailable message on an empty reply", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ response: "" });
    expect(await sendChatMessage("hello")).toBe(UNAVAILABLE_MESSAGE);
  });
});
