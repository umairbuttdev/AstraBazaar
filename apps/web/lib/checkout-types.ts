export type CheckoutQuoteItem = {
  id: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  available: number;
  issue: string | null;
  variantName: string | null;
  sku: string;
  productName: string;
  productSlug: string;
  attributes: Record<string, string | number> | null;
};

export type CheckoutShippingMethod = {
  id: string;
  name: string;
  amount: string;
  estimate: string | null;
};

export type CheckoutPaymentMethod = {
  id: "cod" | "online";
  name: string;
  available: boolean;
  detail: string;
};

export type CheckoutQuote = {
  items: CheckoutQuoteItem[];
  subtotal: string;
  discount: string;
  shipping: CheckoutShippingMethod;
  shippingMethods: CheckoutShippingMethod[];
  total: string;
  currency: string;
  ready: boolean;
  issues: string[];
  paymentMethods: CheckoutPaymentMethod[];
};

export type SavedAddress = {
  id: string;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  label?: string | null;
  isDefault?: boolean;
  country: string;
  phone: string | null;
};
