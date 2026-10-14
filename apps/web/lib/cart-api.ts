import { createClient } from "@/lib/supabase/server";
import type { Cart } from "./cart-types";

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

async function cartFetch<T>(
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
    throw new Error(message ?? `Cart API failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getCart() {
  return cartFetch<Cart>("/cart", { allowUnauthorized: true });
}

export async function addCartItem(variantId: string, quantity = 1) {
  return cartFetch<Cart>("/cart/items", {
    method: "POST",
    body: JSON.stringify({ variantId, quantity }),
  });
}

export async function updateCartItem(itemId: string, quantity: number) {
  return cartFetch<Cart>(`/cart/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(itemId: string) {
  return cartFetch<Cart>(`/cart/items/${itemId}`, {
    method: "DELETE",
  });
}
