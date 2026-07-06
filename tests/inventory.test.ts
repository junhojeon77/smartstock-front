import { describe, expect, it } from "vitest";
import { suggestReorders } from "@/lib/inventory";
import type { InventoryItem } from "@/types/index";

function item(overrides: Partial<InventoryItem>): InventoryItem {
  return {
    item_id: 1,
    item_name: "Test Item",
    category: "Test",
    quantity: 0,
    minimum_threshold: 0,
    expiry_date: null,
    ...overrides,
  } as InventoryItem;
}

const NOW = new Date("2026-07-06T12:00:00Z");

describe("suggestReorders reasons and severity", () => {
  it("explains low stock against the configured minimum (warning)", () => {
    const [s] = suggestReorders(
      [item({ quantity: 15, minimum_threshold: 30 })],
      NOW,
    );
    expect(s.suggestedQty).toBe(45); // 2×30 − 15
    expect(s.reason).toBe(
      "15 on hand is at or below your 30-unit minimum — topping up to 2× minimum (60).",
    );
    expect(s.status).toBe("Low Stock");
    expect(s.severity).toBe("warning");
  });

  it("explains out of stock with a configured minimum (critical)", () => {
    const [s] = suggestReorders(
      [item({ quantity: 0, minimum_threshold: 30 })],
      NOW,
    );
    expect(s.suggestedQty).toBe(60);
    expect(s.reason).toBe(
      "Out of stock — restocking to 2× your 30-unit minimum (60).",
    );
    expect(s.severity).toBe("critical");
  });

  it("explains the default buffer when no minimum is set", () => {
    const [s] = suggestReorders(
      [item({ quantity: 0, minimum_threshold: 0 })],
      NOW,
    );
    expect(s.suggestedQty).toBe(10);
    expect(s.reason).toBe(
      "0 on hand with no minimum set — suggesting the default buffer of 10.",
    );
  });

  it("flags expired stock as critical and replaces it", () => {
    const [s] = suggestReorders(
      [
        item({
          quantity: 120,
          minimum_threshold: 30,
          expiry_date: "2026-05-25T00:00:00Z",
        }),
      ],
      NOW,
    );
    expect(s.status).toBe("Expired");
    expect(s.severity).toBe("critical");
    expect(s.suggestedQty).toBe(60);
    expect(s.reason).toBe(
      "Expired — replace the 120 unusable units on hand (target 60).",
    );
  });

  it("flags expiring-soon stock as a warning with days remaining", () => {
    const [s] = suggestReorders(
      [
        item({
          quantity: 40,
          minimum_threshold: 30,
          expiry_date: "2026-07-08T12:00:00Z",
        }),
      ],
      NOW,
    );
    expect(s.status).toBe("Expiring Soon");
    expect(s.severity).toBe("warning");
    expect(s.suggestedQty).toBe(40);
    expect(s.reason).toBe(
      "Expires in 2 days — plan to replace the 40 units on hand.",
    );
  });

  it("sorts critical suggestions before warnings", () => {
    const result = suggestReorders(
      [
        item({ item_id: 1, quantity: 15, minimum_threshold: 30 }), // warning
        item({ item_id: 2, quantity: 0, minimum_threshold: 30 }), // critical
      ],
      NOW,
    );
    expect(result.map((s) => s.severity)).toEqual(["critical", "warning"]);
  });

  it("suggests nothing for healthy items", () => {
    expect(
      suggestReorders([item({ quantity: 100, minimum_threshold: 30 })], NOW),
    ).toEqual([]);
  });
});
