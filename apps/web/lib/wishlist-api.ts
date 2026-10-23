import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Wishlist } from "./wishlist-types";

function getApiBaseUrl() {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:3001"
  );
}

async function getAccessToken() {
  await connection();
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

async function wishlistFetch<T>(
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
    throw new Error(message ?? `Wishlist API failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const getWishlist = cache(async () => {
  try {
    return await wishlistFetch<Wishlist>("/wishlist", {
      allowUnauthorized: true,
    });
  } catch {
    return null;
  }
});

export async function addWishlistItem(productId: string) {
  return wishlistFetch<Wishlist>("/wishlist/items", {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
}

export async function removeWishlistItem(productId: string) {
  return wishlistFetch<Wishlist>(`/wishlist/products/${productId}`, {
    method: "DELETE",
  });
}
