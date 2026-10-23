import { connection } from "next/server";
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

export type AdminPage<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminCatalogOption = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  _count?: { products: number; children?: number };
};

export type AdminDashboard = {
  range: "today" | "7d" | "30d" | "all";
  orderValue: string;
  orderCount: number;
  currency: string;
  ordersByStatus: Partial<Record<Order["status"], number>>;
  openOrders: number;
  failedPayments: number;
  lowStock: number;
  outOfStock: number;
  productsByStatus: Record<string, number>;
  recentOrders: Array<{
    id: string;
    status: Order["status"];
    total: string;
    currency: string;
    createdAt: string;
    fullName: string;
    email: string;
    paymentStatus: string;
    itemCount: number;
  }>;
};

export type AdminCustomer = {
  id: string;
  email: string;
  fullName: string | null;
  role: "CUSTOMER" | "ADMIN";
  createdAt: string;
  _count: { orders: number };
};

export type AdminCustomerDetail = AdminCustomer & {
  addresses: Array<{
    id: string;
    label: string | null;
    fullName: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string | null;
    postalCode: string;
    country: string;
    phone: string | null;
    isDefault: boolean;
  }>;
  orders: Array<{
    id: string;
    status: Order["status"];
    total: string;
    currency: string;
    createdAt: string;
    paymentStatus: string;
    paymentMethod: string;
    itemCount: number;
  }>;
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
  images?: Array<{ url: string; alt?: string }>;
  variants: Array<{
    sku?: string;
    name?: string;
    price: string;
    compareAtPrice?: string;
    quantity: number;
    attributes?: Array<{ name: string; value: string }>;
    attributeName?: string;
    attributeValue?: string;
    images?: Array<{ url: string; alt?: string }>;
  }>;
};

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
      detail?: string;
      statusCode?: number;
      error?: string;
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : body?.message;
    const detail =
      typeof body?.detail === "string" && body.detail.trim()
        ? body.detail.trim()
        : null;
    const resolved =
      detail && detail !== message
        ? `${message ?? `Admin API failed with ${response.status}`} (${detail})`
        : (message ?? `Admin API failed with ${response.status}`);
    console.error("[admin-api]", {
      path,
      status: response.status,
      message,
      detail,
      error: body?.error,
    });
    throw new Error(resolved);
  }

  return response.json() as Promise<T>;
}

function queryString(query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

export async function adminGetDashboard(range?: string) {
  return adminFetch<AdminDashboard>(`/admin/dashboard${queryString({ range })}`);
}

export async function adminListProducts(query?: {
  page?: number;
  status?: string;
  categoryId?: string;
  brandId?: string;
  q?: string;
}) {
  return adminFetch<AdminPage<Product>>(
    `/admin/products${queryString(query ?? {})}`,
  );
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

export async function adminAddVariant(
  productId: string,
  input: AdminCreateProductInput["variants"][number],
) {
  return adminFetch<Product>(`/admin/products/${productId}/variants`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function adminExpandPackedOptions(productId: string) {
  return adminFetch<Product>(`/admin/products/${productId}/expand-options`, {
    method: "POST",
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
    images?: Array<{ url: string; alt?: string }>;
  },
) {
  return adminFetch<Product>(`/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function adminDeleteProduct(id: string) {
  return adminFetch<{ ok: boolean; id: string }>(`/admin/products/${id}`, {
    method: "DELETE",
  });
}

export async function adminUpdateVariant(
  productId: string,
  variantId: string,
  input: AdminCreateProductInput["variants"][number] & { isDefault?: boolean },
) {
  return adminFetch<Product>(
    `/admin/products/${productId}/variants/${variantId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export async function adminDeleteVariant(productId: string, variantId: string) {
  return adminFetch<Product>(
    `/admin/products/${productId}/variants/${variantId}`,
    {
      method: "DELETE",
    },
  );
}

export async function adminListInventory(query?: {
  page?: number;
  q?: string;
  stock?: string;
}) {
  return adminFetch<AdminPage<AdminInventoryRow>>(
    `/admin/inventory${queryString(query ?? {})}`,
  );
}

export async function adminUpdateInventory(variantId: string, quantity: number) {
  return adminFetch<AdminInventoryRow>(`/admin/inventory/${variantId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export async function adminListOrders(query?: {
  page?: number;
  status?: string;
  paymentStatus?: string;
  q?: string;
}) {
  return adminFetch<AdminPage<Order>>(
    `/admin/orders${queryString(query ?? {})}`,
  );
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

export async function adminDeleteOrder(id: string) {
  return adminFetch<{ ok: boolean; id: string }>(`/admin/orders/${id}`, {
    method: "DELETE",
  });
}

export async function adminListCustomers(query?: { page?: number; q?: string }) {
  return adminFetch<AdminPage<AdminCustomer>>(
    `/admin/customers${queryString(query ?? {})}`,
  );
}

export async function adminGetCustomer(id: string) {
  return adminFetch<AdminCustomerDetail>(`/admin/customers/${id}`);
}

export async function adminListCategories() {
  return adminFetch<AdminCatalogOption[]>("/admin/categories");
}

export async function adminCreateCategory(input: {
  name: string;
  description?: string;
  parentId?: string;
}) {
  return adminFetch<AdminCatalogOption>("/admin/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function adminListBrands() {
  return adminFetch<AdminCatalogOption[]>("/admin/brands");
}

export async function adminCreateBrand(input: { name: string; description?: string }) {
  return adminFetch<AdminCatalogOption>("/admin/brands", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
