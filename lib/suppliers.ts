import { apiFetch } from "@/lib/api";
import type { ItemPricesResponse, Supplier, SupplierOffer } from "@/types/index";

/**
 * Supplier price-comparison client.
 *
 * Numbers come from the backend GET /api/inventory/<id>/prices endpoint, which
 * returns supplier offers already sorted cheapest first with the cheapest one
 * flagged `is_lowest`. The backend is the source of truth; this helper just
 * validates the untrusted payload before it reaches the UI.
 */

export type PricesParseResult =
  | { ok: true; value: ItemPricesResponse }
  | { ok: false; error: string };

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseOffer(raw: unknown): SupplierOffer | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (!isFiniteNumber(o.supplier_id)) return null;
  if (typeof o.supplier_name !== "string") return null;
  if (!isFiniteNumber(o.price)) return null;
  return {
    supplier_id: o.supplier_id,
    supplier_name: o.supplier_name,
    price: o.price,
    last_updated: typeof o.last_updated === "string" ? o.last_updated : undefined,
    is_lowest: o.is_lowest === true,
  };
}

/** Validate an untrusted /api/inventory/<id>/prices payload. */
export function parsePricesResponse(raw: unknown): PricesParseResult {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "Response was not an object." };
  }
  const r = raw as Record<string, unknown>;
  if (!isFiniteNumber(r.item_id)) {
    return { ok: false, error: "Missing or invalid item_id." };
  }
  if (!Array.isArray(r.offers)) {
    return { ok: false, error: "Missing or invalid offers array." };
  }

  const offers: SupplierOffer[] = [];
  for (const o of r.offers) {
    const parsed = parseOffer(o);
    if (parsed) offers.push(parsed);
  }

  // ponytail: trust the backend's sort + is_lowest. Only fall back to the
  // cheapest if the flag is missing, so the table always highlights one row.
  if (offers.length > 0 && !offers.some((o) => o.is_lowest)) {
    const min = Math.min(...offers.map((o) => o.price));
    for (const o of offers) o.is_lowest = o.price === min;
  }

  return {
    ok: true,
    value: {
      item_id: r.item_id,
      offer_count: isFiniteNumber(r.offer_count) ? r.offer_count : offers.length,
      best_price: isFiniteNumber(r.best_price)
        ? r.best_price
        : offers[0]?.price ?? 0,
      offers,
    },
  };
}

/** Fetch and validate supplier offers for one item. */
export async function fetchItemPrices(
  itemId: number,
): Promise<ItemPricesResponse> {
  const raw = await apiFetch<unknown>(`/api/inventory/${itemId}/prices`);
  const parsed = parsePricesResponse(raw);
  if (!parsed.ok) {
    throw new Error(`Invalid prices response: ${parsed.error}`);
  }
  return parsed.value;
}

function parseSupplier(raw: unknown): Supplier | null {
  if (typeof raw !== "object" || raw === null) return null;
  const s = raw as Record<string, unknown>;
  if (!isFiniteNumber(s.supplier_id)) return null;
  if (typeof s.supplier_name !== "string") return null;
  return {
    supplier_id: s.supplier_id,
    supplier_name: s.supplier_name,
    contact_info: typeof s.contact_info === "string" ? s.contact_info : "",
    location: typeof s.location === "string" ? s.location : "",
  };
}

/** Fetch the supplier registry (GET /api/suppliers), dropping malformed rows. */
export async function fetchSuppliers(): Promise<Supplier[]> {
  const raw = await apiFetch<unknown>("/api/suppliers");
  if (!Array.isArray(raw)) {
    throw new Error("Invalid suppliers response: expected an array.");
  }
  return raw
    .map(parseSupplier)
    .filter((s): s is Supplier => s !== null);
}
