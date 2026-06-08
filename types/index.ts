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
