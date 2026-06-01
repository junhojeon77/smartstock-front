export type InventoryItem = {
  item_id: number;
  item_name: string;
  category: string;
  quantity: number;
  minimum_threshold?: number;
  expiry_date: string | null;
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
