import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  evaluateInventoryAlerts,
  evaluateStockoutAlerts,
  evaluateExpiryAlerts,
  buildStockoutAlert,
  summarizeAlerts,
  fetchInventoryAlerts,
  configureThreshold,
  EXPIRY_WARNING_DAYS,
} from "@/lib/alerts";
import type { InventoryItem, StockAlertsResponse } from "@/types/index";

// apiFetch is mocked for the integration tests below.
vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));
import { apiFetch } from "@/lib/api";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const NOW = new Date("2026-06-08T12:00:00.000Z");

/** ISO timestamp `n` whole days from NOW (negative = in the past). */
function daysFromNow(n: number): string {
  return new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000).toISOString();
}

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    item_id: 1,
    item_name: "Test Item",
    category: "Produce",
    quantity: 100,
    minimum_threshold: 10,
    expiry_date: null,
    ...overrides,
  };
}

// ============================================================================
// UNIT TESTS — evaluateInventoryAlerts (the alert trigger logic)
// ============================================================================

describe("evaluateInventoryAlerts — stockout triggers", () => {
  it("raises a critical stockout when quantity is zero", () => {
    const alerts = evaluateInventoryAlerts([makeItem({ quantity: 0 })], NOW);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      type: "stockout",
      severity: "critical",
      item_id: 1,
    });
    expect(alerts[0].message).toContain("out of stock");
  });

  it("raises a critical stockout for negative quantity", () => {
    const alerts = evaluateInventoryAlerts([makeItem({ quantity: -5 })], NOW);
    expect(alerts[0]).toMatchObject({ type: "stockout", severity: "critical" });
  });

  it("raises a warning stockout when quantity is at or below threshold", () => {
    const alerts = evaluateInventoryAlerts(
      [makeItem({ quantity: 5, minimum_threshold: 10 })],
      NOW,
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ type: "stockout", severity: "warning" });
  });

  it("treats quantity exactly equal to threshold as a warning (boundary)", () => {
    const alerts = evaluateInventoryAlerts(
      [makeItem({ quantity: 10, minimum_threshold: 10 })],
      NOW,
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("warning");
  });

  it("does not raise a stockout when quantity is healthy", () => {
    const alerts = evaluateInventoryAlerts(
      [makeItem({ quantity: 100, minimum_threshold: 10 })],
      NOW,
    );
    expect(alerts).toHaveLength(0);
  });

  it("defaults a missing threshold to 0 (only out-of-stock triggers)", () => {
    const lowButNoThreshold = makeItem({
      quantity: 3,
      minimum_threshold: undefined,
      expiry_date: null,
    });
    expect(evaluateInventoryAlerts([lowButNoThreshold], NOW)).toHaveLength(0);

    const empty = makeItem({ quantity: 0, minimum_threshold: undefined });
    expect(evaluateInventoryAlerts([empty], NOW)[0].severity).toBe("critical");
  });
});

describe("evaluateInventoryAlerts — expiry triggers", () => {
  it("raises a critical expiry alert for already-expired items", () => {
    const alerts = evaluateInventoryAlerts(
      [makeItem({ expiry_date: daysFromNow(-1) })],
      NOW,
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ type: "expiry", severity: "critical" });
    expect(alerts[0].daysUntilExpiry).toBeLessThan(0);
  });

  it("raises a warning expiry alert within the warning window", () => {
    const alerts = evaluateInventoryAlerts(
      [makeItem({ expiry_date: daysFromNow(2) })],
      NOW,
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ type: "expiry", severity: "warning" });
    expect(alerts[0].daysUntilExpiry).toBe(2);
  });

  it("flags items expiring today with a friendly message", () => {
    const alerts = evaluateInventoryAlerts(
      [makeItem({ expiry_date: daysFromNow(0) })],
      NOW,
    );
    expect(alerts[0].daysUntilExpiry).toBe(0);
    expect(alerts[0].message).toContain("expires today");
  });

  it("does not raise an expiry alert beyond the warning window", () => {
    const alerts = evaluateInventoryAlerts(
      [makeItem({ expiry_date: daysFromNow(EXPIRY_WARNING_DAYS + 1) })],
      NOW,
    );
    expect(alerts).toHaveLength(0);
  });

  it("ignores null and unparseable expiry dates", () => {
    expect(
      evaluateInventoryAlerts([makeItem({ expiry_date: null })], NOW),
    ).toHaveLength(0);
    expect(
      evaluateInventoryAlerts(
        [makeItem({ expiry_date: "not-a-date" })],
        NOW,
      ),
    ).toHaveLength(0);
  });
});

describe("evaluateInventoryAlerts — combined & ordering", () => {
  it("emits both a stockout and an expiry alert for one item when both apply", () => {
    const alerts = evaluateInventoryAlerts(
      [makeItem({ quantity: 2, minimum_threshold: 10, expiry_date: daysFromNow(1) })],
      NOW,
    );
    expect(alerts).toHaveLength(2);
    expect(alerts.map((a) => a.type).sort()).toEqual(["expiry", "stockout"]);
  });

  it("sorts critical alerts before warnings", () => {
    const alerts = evaluateInventoryAlerts(
      [
        makeItem({ item_id: 1, item_name: "Low Item", quantity: 5, minimum_threshold: 10 }),
        makeItem({ item_id: 2, item_name: "Empty Item", quantity: 0 }),
      ],
      NOW,
    );
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[1].severity).toBe("warning");
  });

  it("returns an empty list for an empty inventory", () => {
    expect(evaluateInventoryAlerts([], NOW)).toEqual([]);
  });
});

// ============================================================================
// UNIT TESTS — summarizeAlerts
// ============================================================================

describe("summarizeAlerts", () => {
  it("counts totals by severity", () => {
    const alerts = evaluateInventoryAlerts(
      [
        makeItem({ item_id: 1, quantity: 0 }), // critical
        makeItem({ item_id: 2, quantity: 5, minimum_threshold: 10 }), // warning
        makeItem({ item_id: 3, expiry_date: daysFromNow(1) }), // warning
      ],
      NOW,
    );
    expect(summarizeAlerts(alerts)).toEqual({ total: 3, critical: 1, warning: 2 });
  });

  it("returns zeroed counts for no alerts", () => {
    expect(summarizeAlerts([])).toEqual({ total: 0, critical: 0, warning: 0 });
  });
});

// ============================================================================
// INTEGRATION TESTS — fetchInventoryAlerts (fetch → evaluate pipeline)
// ============================================================================

describe("buildStockoutAlert", () => {
  it("marks out-of-stock items as critical", () => {
    const alert = buildStockoutAlert(makeItem({ quantity: 0 }));
    expect(alert).toMatchObject({ type: "stockout", severity: "critical" });
  });

  it("marks at/below-threshold items as warning", () => {
    const alert = buildStockoutAlert(makeItem({ quantity: 4, minimum_threshold: 10 }));
    expect(alert).toMatchObject({ type: "stockout", severity: "warning" });
  });
});

describe("evaluateStockoutAlerts / evaluateExpiryAlerts are independent", () => {
  it("evaluateStockoutAlerts ignores expiry entirely", () => {
    const items = [makeItem({ quantity: 100, expiry_date: daysFromNow(-1) })];
    expect(evaluateStockoutAlerts(items)).toHaveLength(0);
  });

  it("evaluateExpiryAlerts ignores stock levels entirely", () => {
    const items = [makeItem({ quantity: 0, expiry_date: daysFromNow(60) })];
    expect(evaluateExpiryAlerts(items, NOW)).toHaveLength(0);
  });
});

// ============================================================================
// INTEGRATION TESTS — fetchInventoryAlerts (backend stockout + client expiry)
// ============================================================================

describe("fetchInventoryAlerts — end-to-end pipeline", () => {
  const mockedApiFetch = vi.mocked(apiFetch);

  /**
   * Wire the mock so the backend stockout endpoint and the raw inventory
   * endpoint return independently-controllable payloads.
   */
  function mockEndpoints(opts: {
    stock: StockAlertsResponse;
    inventory: InventoryItem[];
  }) {
    mockedApiFetch.mockImplementation((path: string) => {
      if (path === "/api/inventory/alerts") return Promise.resolve(opts.stock) as never;
      if (path === "/api/inventory") return Promise.resolve(opts.inventory) as never;
      return Promise.reject(new Error(`unexpected path ${path}`)) as never;
    });
  }

  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it("uses the backend endpoint as the source of truth for stockout alerts", async () => {
    mockEndpoints({
      stock: {
        alert_count: 1,
        items_at_risk: [makeItem({ item_id: 101, item_name: "Fresh Tomatoes", quantity: 0 })],
      },
      // Raw inventory disagrees on stock (qty 999) — backend must win.
      inventory: [makeItem({ item_id: 101, item_name: "Fresh Tomatoes", quantity: 999 })],
    });

    const alerts = await fetchInventoryAlerts(NOW);

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/inventory/alerts");
    expect(mockedApiFetch).toHaveBeenCalledWith("/api/inventory");
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      item_id: 101,
      type: "stockout",
      severity: "critical",
    });
  });

  it("merges backend stockout alerts with client-side expiry alerts", async () => {
    mockEndpoints({
      stock: {
        alert_count: 1,
        items_at_risk: [makeItem({ item_id: 1, item_name: "Low Item", quantity: 2, minimum_threshold: 10 })],
      },
      inventory: [
        makeItem({ item_id: 1, item_name: "Low Item", quantity: 2, minimum_threshold: 10 }),
        makeItem({ item_id: 2, item_name: "Old Milk", quantity: 50, expiry_date: daysFromNow(-1) }),
      ],
    });

    const alerts = await fetchInventoryAlerts(NOW);

    // critical expiry first, then warning stockout
    expect(alerts).toHaveLength(2);
    expect(alerts[0]).toMatchObject({ item_id: 2, type: "expiry", severity: "critical" });
    expect(alerts[1]).toMatchObject({ item_id: 1, type: "stockout", severity: "warning" });
  });

  it("returns no alerts when backend reports none and nothing is expiring", async () => {
    mockEndpoints({
      stock: { alert_count: 0, items_at_risk: [] },
      inventory: [makeItem({ item_id: 1, quantity: 500, expiry_date: daysFromNow(60) })],
    });
    await expect(fetchInventoryAlerts(NOW)).resolves.toEqual([]);
  });

  it("propagates backend/network errors from apiFetch", async () => {
    mockedApiFetch.mockRejectedValue(new Error("Backend unavailable"));
    await expect(fetchInventoryAlerts(NOW)).rejects.toThrow("Backend unavailable");
  });
});

// ============================================================================
// INTEGRATION TESTS — configureThreshold
// ============================================================================

describe("configureThreshold", () => {
  const mockedApiFetch = vi.mocked(apiFetch);

  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it("PUTs the new minimum threshold to the dedicated endpoint", async () => {
    mockedApiFetch.mockResolvedValue({ message: "Threshold configured successfully" });

    await configureThreshold(101, 25);

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/inventory/101/threshold", {
      method: "PUT",
      body: JSON.stringify({ minimum_threshold: 25 }),
    });
  });

  it("propagates errors from the backend", async () => {
    mockedApiFetch.mockRejectedValue(new Error("404: Item not found"));
    await expect(configureThreshold(999, 5)).rejects.toThrow("Item not found");
  });
});
