export type InventoryItem = {
  item_id: number;
  item_name: string;
  category: string;
  quantity: number;
  minimum_threshold?: number;
  expiry_date: string | null;
};

export type AlertSeverity = "critical" | "warning";
export type AlertType = "stockout" | "expiry";

export type InventoryAlert = {
  item_id: number;
  item_name: string;
  type: AlertType;
  severity: AlertSeverity;
  quantity: number;
  threshold: number;
  message: string;
  /** Whole days until expiry; negative if already expired. Only set on expiry alerts. */
  daysUntilExpiry?: number;
};

export type AlertSummary = {
  total: number;
  critical: number;
  warning: number;
};

/** Shape returned by the backend GET /api/inventory/alerts endpoint. */
export type StockAlertsResponse = {
  alert_count: number;
  items_at_risk: InventoryItem[];
};

/** A single point of sales history for an inventory item. */
export type SalesHistoryPoint = {
  date: string;
  quantity_sold: number;
};

/** Shape returned by the backend POST /api/forecast endpoint. */
export type ForecastResponse = {
  item_id: number;
  predicted_demand: number;
  /** Model confidence in the range 0..1. */
  confidence_level: number;
  message: string;
};

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  /** True while the assistant reply is still being fetched. */
  pending?: boolean;
};

/** Shape returned by the backend POST /api/chat endpoint. */
export type ChatResponse = {
  response: string;
  source?: string;
};

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  ingredients: { itemId: string; quantity: number }[];
};

export type Vendor = {
  id: string;
  name: string;
  location: string;
};

/** A supplier in the registry, from GET /api/suppliers. */
export type Supplier = {
  supplier_id: number;
  supplier_name: string;
  contact_info: string;
  location: string;
};

/** One supplier's offer for an item, from GET /api/inventory/<id>/prices. */
export type SupplierOffer = {
  supplier_id: number;
  supplier_name: string;
  price: number;
  /** ISO timestamp of the last price update, when the backend supplies one. */
  last_updated?: string;
  /** Backend marks the cheapest offer to highlight. */
  is_lowest: boolean;
};

/** Shape returned by GET /api/inventory/<id>/prices. Offers are sorted cheapest first. */
export type ItemPricesResponse = {
  item_id: number;
  offer_count: number;
  best_price: number;
  offers: SupplierOffer[];
};
