export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "FULFILLED"
  | "CANCELLED";

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
  status: OrderStatus;
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

export const ORDER_STEPPER_STEPS = [
  { status: "PENDING" as const, label: "Placed" },
  { status: "CONFIRMED" as const, label: "Confirmed" },
  { status: "PROCESSING" as const, label: "Preparing" },
  { status: "SHIPPED" as const, label: "On the way" },
  { status: "FULFILLED" as const, label: "Delivered" },
];

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
];

export function orderStatusLabel(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return "Placed";
    case "CONFIRMED":
      return "Confirmed";
    case "PROCESSING":
      return "Preparing";
    case "SHIPPED":
      return "On the way";
    case "FULFILLED":
      return "Delivered";
    case "CANCELLED":
      return "Cancelled";
  }
}

export function isActiveOrderStatus(status: OrderStatus) {
  return ACTIVE_ORDER_STATUSES.includes(status);
}

export function stepperIndexForStatus(status: OrderStatus) {
  if (status === "CANCELLED") {
    return -1;
  }
  const index = ORDER_STEPPER_STEPS.findIndex((step) => step.status === status);
  return index;
}
