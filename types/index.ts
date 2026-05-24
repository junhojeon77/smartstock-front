export type { Role, SessionUser } from "@/lib/session";

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  threshold: number;
  expiry: string | null;
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
