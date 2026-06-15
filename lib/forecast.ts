import { apiFetch } from "@/lib/api";
import type { ForecastResponse, SalesHistoryPoint } from "@/types/index";

/**
 * Demand forecasting client.
 *
 * The numbers come from the backend POST /api/forecast endpoint, which runs a
 * time-series model over the item's stored sales history and returns a single
 * predicted demand value plus a confidence level. The backend is the source of
 * truth; the helpers here send the request, then defensively validate and
 * sanity-check the response before any of it reaches the UI.
 */

/** Forecasts more than this multiple of the historical peak are treated as implausible. */
export const PLAUSIBILITY_MAX_FACTOR = 3;

/** Result of validating an untrusted forecast payload. */
export type ForecastParseResult =
  | { ok: true; value: ForecastResponse }
  | { ok: false; error: string };

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Validate and normalize an untrusted /api/forecast payload.
 *
 * Returns a discriminated result rather than throwing so it stays trivial to
 * unit-test against sample payloads. Out-of-range confidence is clamped to
 * [0, 1] rather than rejected, since the model occasionally emits tiny
 * floating-point overshoots.
 */
export function parseForecastResponse(raw: unknown): ForecastParseResult {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "Response was not an object." };
  }
  const r = raw as Record<string, unknown>;

  if (!isFiniteNumber(r.item_id)) {
    return { ok: false, error: "Missing or invalid item_id." };
  }
  if (!isFiniteNumber(r.predicted_demand)) {
    return { ok: false, error: "Missing or invalid predicted_demand." };
  }
  if (r.predicted_demand < 0) {
    return { ok: false, error: "predicted_demand cannot be negative." };
  }
  if (!isFiniteNumber(r.confidence_level)) {
    return { ok: false, error: "Missing or invalid confidence_level." };
  }

  return {
    ok: true,
    value: {
      item_id: r.item_id,
      predicted_demand: r.predicted_demand,
      confidence_level: Math.max(0, Math.min(1, r.confidence_level)),
      message: typeof r.message === "string" ? r.message : "",
    },
  };
}

/** Summary statistics derived from sample historical sales. */
export type HistoryStats = {
  count: number;
  min: number;
  max: number;
  mean: number;
};

/** Outcome of sanity-checking a forecast against the item's own sales history. */
export type PlausibilityResult = {
  plausible: boolean;
  reason?: string;
  stats: HistoryStats | null;
};

function summarize(history: SalesHistoryPoint[]): HistoryStats | null {
  const qtys = history
    .map((p) => p.quantity_sold)
    .filter((q) => isFiniteNumber(q));
  if (qtys.length === 0) return null;
  const sum = qtys.reduce((a, b) => a + b, 0);
  return {
    count: qtys.length,
    min: Math.min(...qtys),
    max: Math.max(...qtys),
    mean: sum / qtys.length,
  };
}

/**
 * Cross-check a validated forecast against the item's sample sales history.
 *
 * A forecast is flagged as implausible when it exceeds {@link
 * PLAUSIBILITY_MAX_FACTOR}× the historical peak — a cheap guard against a
 * mis-trained model or a bad payload that nonetheless passes shape validation.
 * With no history we cannot judge, so it is treated as plausible (the backend
 * already gates on having data at all).
 */
export function assessForecastPlausibility(
  forecast: ForecastResponse,
  history: SalesHistoryPoint[],
): PlausibilityResult {
  const stats = summarize(history);
  if (!stats) {
    return { plausible: true, stats: null };
  }
  const ceiling = stats.max * PLAUSIBILITY_MAX_FACTOR;
  if (forecast.predicted_demand > ceiling) {
    return {
      plausible: false,
      reason: `Forecast ${forecast.predicted_demand} is more than ${PLAUSIBILITY_MAX_FACTOR}× the historical peak of ${stats.max}.`,
      stats,
    };
  }
  return { plausible: true, stats };
}

/** Human-readable bucket for a 0..1 confidence level. */
export function confidenceLabel(level: number): "High" | "Medium" | "Low" {
  if (level >= 0.75) return "High";
  if (level >= 0.5) return "Medium";
  return "Low";
}

/**
 * Request a demand forecast for an item from the backend and return the
 * validated response. Throws on a transport error (via apiFetch) or when the
 * payload fails validation.
 */
export async function fetchForecast(itemId: number): Promise<ForecastResponse> {
  const raw = await apiFetch<unknown>("/api/forecast", {
    method: "POST",
    body: JSON.stringify({ item_id: itemId }),
  });

  const parsed = parseForecastResponse(raw);
  if (!parsed.ok) {
    throw new Error(`Invalid forecast response: ${parsed.error}`);
  }
  return parsed.value;
}
