import { createClient } from "@/lib/supabase/server";
import type { Product } from "./types";
import type { Order } from "./order-types";

export type AdminInventoryRow = {
  id: string;
  variantId: string;
  quantity: number;
  reserved: number;
  available: number;
  updatedAt: string;
  sku: string;
  variantName: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
};

export type AdminCatalogOption = {
  id: string;
  name: string;
  slug: string;
};

export type AdminCreateProductInput = {
  name: string;
  slug: string;
  description?: string;
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  categoryId?: string;
  brandId?: string;
  imageUrl?: string;
  imageAlt?: string;
  variant: {
    sku: string;
    name?: string;
    price: string;
    compareAtPrice?: string;
    quantity: number;
  };
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

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
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
    throw new Error("UNAUTHORIZED");
  }
  if (response.status === 403) {
    throw new Error("FORBIDDEN");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : body?.message;
    throw new Error(message ?? `Admin API failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function adminListProducts() {
  return adminFetch<Product[]>("/admin/products");
}

export async function adminGetProduct(id: string) {
  return adminFetch<Product>(`/admin/products/${id}`);
}

export async function adminCreateProduct(input: AdminCreateProductInput) {
  return adminFetch<Product>("/admin/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function adminUpdateProduct(
  id: string,
  input: {
    name?: string;
    slug?: string;
    description?: string | null;
    status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
    categoryId?: string | null;
    brandId?: string | null;
    imageUrl?: string;
    imageAlt?: string;
  },
) {
  return adminFetch<Product>(`/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function adminListInventory() {
  return adminFetch<AdminInventoryRow[]>("/admin/inventory");
}

export async function adminUpdateInventory(variantId: string, quantity: number) {
  return adminFetch<AdminInventoryRow>(`/admin/inventory/${variantId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export async function adminListOrders() {
  return adminFetch<Order[]>("/admin/orders");
}

export async function adminGetOrder(id: string) {
  return adminFetch<Order>(`/admin/orders/${id}`);
}

export async function adminUpdateOrderStatus(
  id: string,
  status: Order["status"],
) {
  return adminFetch<Order>(`/admin/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function adminListCategories() {
  return adminFetch<AdminCatalogOption[]>("/admin/categories");
}

export async function adminListBrands() {
  return adminFetch<AdminCatalogOption[]>("/admin/brands");
}
