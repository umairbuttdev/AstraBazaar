import { createClient } from "@/lib/supabase/server";
import type { Order } from "./order-types";

export type CheckoutShipping = {
  email: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country?: string;
  phone?: string;
};

function getApiBaseUrl() {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:3001"
  );
}

async function getAccessToken() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

async function checkoutFetch<T>(
  path: string,
  init?: RequestInit & { allowUnauthorized?: boolean },
): Promise<T | null> {
  const token = await getAccessToken();
  if (!token) {
    if (init?.allowUnauthorized) {
      return null;
    }
    throw new Error("UNAUTHORIZED");
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    if (init?.allowUnauthorized) {
      return null;
    }
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : body?.message;
    throw new Error(message ?? `Checkout API failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function placeOrder(shipping: CheckoutShipping) {
  return checkoutFetch<Order>("/checkout", {
    method: "POST",
    body: JSON.stringify(shipping),
  });
}

export async function getOrder(orderId: string) {
  return checkoutFetch<Order>(`/orders/${orderId}`, {
    allowUnauthorized: true,
  });
}

export async function listOrders() {
  return checkoutFetch<Order[]>("/orders", {
    allowUnauthorized: true,
  });
}
