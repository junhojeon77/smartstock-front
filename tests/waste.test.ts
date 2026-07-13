import { describe, expect, it } from "vitest";
import {
  bucketWasteByMonth,
  parseWasteEntry,
  summarizeWaste,
} from "@/lib/waste";
import type { WasteEntry } from "@/types/index";

function entry(overrides: Partial<WasteEntry> = {}): WasteEntry {
  return {
    log_id: 1,
    item_id: 101,
    item_name: "Tomatoes",
    quantity: 5,
    reason: "Expired",
    logged_by: "a@b.c",
    timestamp: "2026-07-10T12:00:00+00:00",
    ...overrides,
  };
}

describe("parseWasteEntry", () => {
  it("accepts a valid backend row", () => {
    expect(parseWasteEntry(entry())).toEqual(entry());
  });

  it("defaults optional fields", () => {
    const parsed = parseWasteEntry({
      item_id: 1,
      item_name: "Milk",
      quantity: 2,
      timestamp: "2026-07-01T00:00:00+00:00",
    });
    expect(parsed?.reason).toBe("unspecified");
    expect(parsed?.logged_by).toBe("unknown");
    expect(parsed?.log_id).toBe(0);
  });

  it("rejects malformed rows", () => {
    expect(parseWasteEntry(null)).toBeNull();
    expect(parseWasteEntry("nope")).toBeNull();
    expect(parseWasteEntry({ item_name: "Milk" })).toBeNull();
    expect(parseWasteEntry(entry({ quantity: NaN as unknown as number }))).toBeNull();
    expect(parseWasteEntry({ ...entry(), timestamp: 123 })).toBeNull();
  });
});

describe("bucketWasteByMonth", () => {
  const now = new Date(2026, 6, 13); // July 2026

  it("returns the last 6 months oldest-first with empty months zeroed", () => {
    const buckets = bucketWasteByMonth([], now);
    expect(buckets.map((b) => b.label)).toEqual([
      "Feb", "Mar", "Apr", "May", "Jun", "Jul",
    ]);
    expect(buckets.every((b) => b.value === 0)).toBe(true);
  });

  it("sums quantities into the right month", () => {
    const buckets = bucketWasteByMonth(
      [
        entry({ quantity: 3, timestamp: "2026-07-02T12:00:00+00:00" }),
        entry({ quantity: 4, timestamp: "2026-07-12T12:00:00+00:00" }),
        entry({ quantity: 9, timestamp: "2026-03-15T12:00:00+00:00" }),
      ],
      now,
    );
    expect(buckets.find((b) => b.label === "Jul")?.value).toBe(7);
    expect(buckets.find((b) => b.label === "Mar")?.value).toBe(9);
  });

  it("parses the backend's RFC 1123 timestamps (Flask jsonify format)", () => {
    const buckets = bucketWasteByMonth(
      [entry({ quantity: 6, timestamp: "Mon, 13 Jul 2026 18:08:56 GMT" })],
      now,
    );
    expect(buckets.find((b) => b.label === "Jul")?.value).toBe(6);
  });

  it("ignores entries outside the window and bad timestamps", () => {
    const buckets = bucketWasteByMonth(
      [
        entry({ quantity: 5, timestamp: "2025-07-15T12:00:00+00:00" }),
        entry({ quantity: 5, timestamp: "not-a-date" }),
      ],
      now,
    );
    expect(buckets.every((b) => b.value === 0)).toBe(true);
  });
});

describe("summarizeWaste", () => {
  it("handles an empty log", () => {
    expect(summarizeWaste([])).toEqual({
      totalQuantity: 0,
      entryCount: 0,
      topItem: null,
      topReason: null,
    });
  });

  it("totals quantity and picks top item (by qty) and reason (by count)", () => {
    const summary = summarizeWaste([
      entry({ item_name: "Tomatoes", quantity: 2, reason: "Spoiled" }),
      entry({ item_name: "Milk", quantity: 10, reason: "Expired" }),
      entry({ item_name: "Tomatoes", quantity: 3, reason: "Spoiled" }),
    ]);
    expect(summary.totalQuantity).toBe(15);
    expect(summary.entryCount).toBe(3);
    expect(summary.topItem).toBe("Milk");
    expect(summary.topReason).toBe("Spoiled");
  });
});
