export type PaymentMethod = "COD" | "ONLINE";
export type PaymentStatus = "UNPAID" | "PENDING" | "PAID" | "FAILED";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "FULFILLED"
  | "CANCELLED";

export type OrderItem = {
  id: string;
  variantId?: string;
  productName: string;
  variantName: string | null;
  sku: string;
  unitPrice: string;
  quantity: number;
  productSlug?: string | null;
};

export type OrderStatusEvent = {
  id: string;
  status: OrderStatus;
  createdAt: string;
};

export type Order = {
  id: string;
  profileId?: string;
  status: OrderStatus;
  subtotal: string;
  shippingAmount?: string;
  total: string;
  currency: string;
  shippingMethod?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  canCancel?: boolean;
  shipment?: null;
  lineCount?: number;
  itemCount?: number;
  email?: string;
  fullName?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string | null;
  postalCode?: string;
  country?: string;
  phone?: string | null;
  items: OrderItem[];
  statusHistory?: OrderStatusEvent[];
  profile?: {
    id: string;
    email: string;
    fullName: string | null;
  };
  createdAt: string;
};

export type OrderList = {
  items: Order[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  counts: {
    all: number;
    active: number;
    completed: number;
    cancelled: number;
  };
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

export function paymentStatusLabel(order: Pick<Order, "paymentMethod" | "paymentStatus">) {
  if (order.paymentMethod === "COD" && order.paymentStatus !== "PAID") {
    return "Pay on delivery";
  }
  switch (order.paymentStatus) {
    case "PAID":
      return "Paid";
    case "PENDING":
      return "Awaiting payment";
    case "FAILED":
      return "Payment failed";
    case "UNPAID":
      return "Unpaid";
    default:
      return null;
  }
}

export function paymentMethodLabel(method: PaymentMethod | undefined) {
  if (method === "COD") return "Cash on delivery";
  if (method === "ONLINE") return "Online payment";
  return null;
}

export function shippingMethodLabel(method: string | undefined) {
  if (!method || method === "standard") return "Standard delivery";
  return method;
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

export function formatOrderMoney(value: string, currency = "USD") {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return value;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatOrderDate(value: string, withTime = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
  }).format(date);
}
