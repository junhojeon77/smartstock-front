import { describe, it, expect } from "vitest";
import { parsePricesResponse } from "@/lib/suppliers";

const validPayload = {
  item_id: 101,
  offer_count: 3,
  best_price: 2.1,
  offers: [
    { supplier_id: 2, supplier_name: "Fresh Valley", price: 2.1, is_lowest: true },
    { supplier_id: 1, supplier_name: "Ontario Local", price: 2.45, is_lowest: false },
    { supplier_id: 3, supplier_name: "Metro Wholesale", price: 2.8, is_lowest: false },
  ],
};

describe("parsePricesResponse", () => {
  it("accepts a well-formed payload and keeps the backend's is_lowest", () => {
    const result = parsePricesResponse(validPayload);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.offers).toHaveLength(3);
      expect(result.value.offers.find((o) => o.is_lowest)?.supplier_id).toBe(2);
    }
  });

  it("falls back to the cheapest when no offer is flagged lowest", () => {
    const result = parsePricesResponse({
      ...validPayload,
      offers: validPayload.offers.map((o) => ({ ...o, is_lowest: false })),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const flagged = result.value.offers.filter((o) => o.is_lowest);
      expect(flagged).toHaveLength(1);
      expect(flagged[0].price).toBe(2.1);
    }
  });

  it("drops malformed offers but keeps valid ones", () => {
    const result = parsePricesResponse({
      ...validPayload,
      offers: [validPayload.offers[0], { supplier_id: "x", price: 1 }],
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.offers).toHaveLength(1);
  });

  it("rejects a non-object or missing offers array", () => {
    expect(parsePricesResponse(null).ok).toBe(false);
    expect(parsePricesResponse({ item_id: 1 }).ok).toBe(false);
  });
});
