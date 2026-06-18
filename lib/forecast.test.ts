import { describe, it, expect } from "vitest";
import {
  parseForecastResponse,
  assessForecastPlausibility,
  confidenceLabel,
  PLAUSIBILITY_MAX_FACTOR,
} from "@/lib/forecast";
import type { ForecastResponse, SalesHistoryPoint } from "@/types/index";

/**
 * Sample historical sales for item #101, mirroring the shape stored in the
 * backend `historical_data` collection. Used to sanity-check forecasts.
 */
const SAMPLE_HISTORY: SalesHistoryPoint[] = [
  { date: "2026-04-06", quantity_sold: 120 },
  { date: "2026-04-13", quantity_sold: 135 },
  { date: "2026-04-20", quantity_sold: 128 },
  { date: "2026-04-27", quantity_sold: 142 },
  { date: "2026-05-04", quantity_sold: 150 },
  { date: "2026-05-11", quantity_sold: 138 },
];

const validPayload = {
  item_id: 101,
  predicted_demand: 144.5,
  confidence_level: 0.82,
  message: "Demand forecast generated successfully",
};

describe("parseForecastResponse", () => {
  it("accepts a well-formed backend payload", () => {
    const result = parseForecastResponse(validPayload);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.item_id).toBe(101);
      expect(result.value.predicted_demand).toBe(144.5);
      expect(result.value.confidence_level).toBe(0.82);
    }
  });

  it("clamps an out-of-range confidence into [0, 1]", () => {
    const result = parseForecastResponse({ ...validPayload, confidence_level: 1.04 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.confidence_level).toBe(1);
  });

  it("defaults a missing message to an empty string", () => {
    const { message, ...rest } = validPayload;
    const result = parseForecastResponse(rest);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.message).toBe("");
  });

  it.each([
    ["non-object", "nope"],
    ["null", null],
    ["missing item_id", { predicted_demand: 10, confidence_level: 0.5 }],
    ["non-numeric predicted_demand", { item_id: 1, predicted_demand: "10", confidence_level: 0.5 }],
    ["negative predicted_demand", { item_id: 1, predicted_demand: -3, confidence_level: 0.5 }],
    ["NaN confidence", { item_id: 1, predicted_demand: 10, confidence_level: NaN }],
    ["missing confidence", { item_id: 1, predicted_demand: 10 }],
  ])("rejects %s", (_label, payload) => {
    const result = parseForecastResponse(payload);
    expect(result.ok).toBe(false);
  });
});

describe("assessForecastPlausibility", () => {
  it("accepts a forecast near the historical range", () => {
    const forecast: ForecastResponse = { ...validPayload };
    const result = assessForecastPlausibility(forecast, SAMPLE_HISTORY);
    expect(result.plausible).toBe(true);
    expect(result.stats).toEqual({ count: 6, min: 120, max: 150, mean: 135.5 });
  });

  it("flags a forecast far above the historical peak", () => {
    // historical max is 150; anything over 150 * factor is implausible
    const forecast: ForecastResponse = {
      ...validPayload,
      predicted_demand: 150 * PLAUSIBILITY_MAX_FACTOR + 1,
    };
    const result = assessForecastPlausibility(forecast, SAMPLE_HISTORY);
    expect(result.plausible).toBe(false);
    expect(result.reason).toContain("historical peak");
  });

  it("treats a forecast with no history as plausible", () => {
    const result = assessForecastPlausibility(validPayload, []);
    expect(result.plausible).toBe(true);
    expect(result.stats).toBeNull();
  });
});

describe("confidenceLabel", () => {
  it("buckets confidence levels", () => {
    expect(confidenceLabel(0.9)).toBe("High");
    expect(confidenceLabel(0.6)).toBe("Medium");
    expect(confidenceLabel(0.3)).toBe("Low");
  });
});
