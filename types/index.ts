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
