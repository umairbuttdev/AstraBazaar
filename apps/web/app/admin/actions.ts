"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  adminCreateProduct,
  adminDeleteOrder,
  adminUpdateInventory,
  adminUpdateOrderStatus,
  adminUpdateProduct,
} from "@/lib/admin-api";
import { saveProductImage } from "@/lib/product-image-upload";

function invalidateCatalogCache() {
  updateTag("products");
}

function handleAdminError(error: unknown, fallbackPath: string): never {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    redirect(`/login?error=${encodeURIComponent("Please login as an admin.")}`);
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    redirect(`/?error=${encodeURIComponent("Admin access required.")}`);
  }
  const message =
    error instanceof Error ? error.message : "Admin action failed";
  redirect(`${fallbackPath}?error=${encodeURIComponent(message)}`);
}

async function maybeUploadImage(formData: FormData) {
  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return undefined;
  }
  return saveProductImage(image);
}

export async function createProductAction(formData: FormData) {
  let imageUrl: string | undefined;
  try {
    imageUrl = await maybeUploadImage(formData);
  } catch (error) {
    handleAdminError(error, "/admin/products/new");
  }

  const payload = {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? "") || undefined,
    status: (String(formData.get("status") ?? "DRAFT") || "DRAFT") as
      | "DRAFT"
      | "ACTIVE"
      | "ARCHIVED",
    categoryId: String(formData.get("categoryId") ?? "") || undefined,
    brandId: String(formData.get("brandId") ?? "") || undefined,
    imageUrl,
    imageAlt: String(formData.get("imageAlt") ?? "") || undefined,
    variant: {
      sku: String(formData.get("sku") ?? ""),
      name: String(formData.get("variantName") ?? "") || undefined,
      price: String(formData.get("price") ?? ""),
      compareAtPrice: String(formData.get("compareAtPrice") ?? "") || undefined,
      quantity: Number(formData.get("quantity") ?? 0),
    },
  };

  let productId: string;
  try {
    const product = await adminCreateProduct(payload);
    productId = product.id;
  } catch (error) {
    handleAdminError(error, "/admin/products/new");
  }

  invalidateCatalogCache();
  redirect(
    `/admin/products/${productId}?message=${encodeURIComponent("Product created.")}`,
  );
}

export async function updateProductAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  let imageUrl: string | undefined;
  try {
    imageUrl = await maybeUploadImage(formData);
  } catch (error) {
    handleAdminError(error, `/admin/products/${id}`);
  }

  const payload = {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? "") || null,
    status: (String(formData.get("status") ?? "DRAFT") || "DRAFT") as
      | "DRAFT"
      | "ACTIVE"
      | "ARCHIVED",
    categoryId: String(formData.get("categoryId") ?? "") || null,
    brandId: String(formData.get("brandId") ?? "") || null,
    imageUrl,
    imageAlt: String(formData.get("imageAlt") ?? "") || undefined,
  };

  try {
    await adminUpdateProduct(id, payload);
  } catch (error) {
    handleAdminError(error, `/admin/products/${id}`);
  }

  invalidateCatalogCache();
  redirect(
    `/admin/products/${id}?message=${encodeURIComponent("Product updated.")}`,
  );
}

export async function updateInventoryAction(formData: FormData) {
  const variantId = String(formData.get("variantId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);

  try {
    await adminUpdateInventory(variantId, quantity);
  } catch (error) {
    handleAdminError(error, "/admin/inventory");
  }

  redirect(
    `/admin/inventory?message=${encodeURIComponent("Inventory updated.")}`,
  );
}

export async function updateOrderStatusAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "SHIPPED"
    | "CANCELLED"
    | "FULFILLED";

  try {
    await adminUpdateOrderStatus(id, status);
  } catch (error) {
    handleAdminError(error, `/admin/orders/${id}`);
  }

  redirect(
    `/admin/orders/${id}?message=${encodeURIComponent("Order status updated.")}`,
  );
}

export async function deleteAdminOrderAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");

  try {
    await adminDeleteOrder(orderId);
  } catch (error) {
    handleAdminError(error, "/admin/orders");
  }

  redirect(
    `/admin/orders?message=${encodeURIComponent("Order deleted.")}`,
  );
}
