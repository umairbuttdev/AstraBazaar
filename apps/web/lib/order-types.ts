export type OrderItem = {
  id: string;
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string;
  unitPrice: string;
  quantity: number;
};

export type Order = {
  id: string;
  profileId: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "FULFILLED";
  subtotal: string;
  total: string;
  currency: string;
  email: string;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
  items: OrderItem[];
  createdAt: string;
};
