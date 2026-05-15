export type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  reorderThreshold: number;
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
