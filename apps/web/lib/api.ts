import { cacheLife } from "next/cache";
import type { Product } from "./types";

function getApiBaseUrl() {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:3001"
  );
}

async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`);

  if (!response.ok) {
    throw new Error(`API ${path} failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getProducts() {
  "use cache";
  cacheLife("minutes");
  return apiFetch<Product[]>("/products");
}

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheLife("minutes");
  return apiFetch<Product>(`/products/${slug}`);
}
