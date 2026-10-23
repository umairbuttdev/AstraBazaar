"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  adminAddVariant,
  adminCreateBrand,
  adminCreateCategory,
  adminCreateProduct,
  adminDeleteOrder,
  adminDeleteProduct,
  adminDeleteVariant,
  adminExpandPackedOptions,
  adminUpdateInventory,
  adminUpdateOrderStatus,
  adminUpdateProduct,
  adminUpdateVariant,
} from "@/lib/admin-api";
import {
  adminFormError,
  findIncompleteChoice,
  findMismatchedChoices,
  snapshotProductDraft,
  type AdminFormState,
} from "@/lib/admin-form-errors";
import { saveProductImage } from "@/lib/product-image-upload";

function invalidateCatalogCache() {
  updateTag("products");
  updateTag("categories");
  updateTag("brands");
}

function handleAdminError(error: unknown, fallbackPath: string): never {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    redirect(`/login?error=${encodeURIComponent("Please login as an admin.")}`);
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    redirect(`/?error=${encodeURIComponent("Admin access required.")}`);
  }
  const raw =
    error instanceof Error ? error.message : "Admin action failed";
  // Keep redirect URLs short; full detail is already in server logs.
  const message = raw.length > 280 ? `${raw.slice(0, 277)}...` : raw;
  redirect(`${fallbackPath}?error=${encodeURIComponent(message)}`);
}

function redirectAuthErrors(error: unknown): void {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    redirect(`/login?error=${encodeURIComponent("Please login as an admin.")}`);
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    redirect(`/?error=${encodeURIComponent("Admin access required.")}`);
  }
}

async function uploadImages(files: File[], alt?: string) {
  if (files.length > 8) {
    throw new Error("Choose up to 8 images");
  }
  const images: Array<{ url: string; alt?: string }> = [];
  for (const file of files) {
    images.push({
      url: await saveProductImage(file),
      alt: alt || undefined,
    });
  }
  return images;
}

function imageFiles(formData: FormData, name: string) {
  return formData
    .getAll(name)
    .filter((value): value is File => value instanceof File && value.size > 0);
}

function formErrorState(
  message: string,
  formData: FormData,
  extras: Partial<AdminFormState> = {},
): AdminFormState {
  return {
    status: "error",
    message,
    values: snapshotProductDraft(formData),
    restoreKey: Date.now(),
    ...extras,
  };
}

function readVariants(formData: FormData) {
  const prices = formData.getAll("price").map((value) => String(value));
  const skus = formData.getAll("sku").map((value) => String(value));
  const names = formData.getAll("variantName").map((value) => String(value));
  const compareAt = formData.getAll("compareAtPrice").map((value) => String(value));
  const quantities = formData.getAll("quantity").map((value) => String(value));

  const variants = prices.map((price, index) => {
    const attributeNames = formData
      .getAll(`attributeName-${index}`)
      .map((value) => String(value));
    const attributeValues = formData
      .getAll(`attributeValue-${index}`)
      .map((value) => String(value));
    const attributes = attributeNames
      .map((name, attributeIndex) => ({
        name,
        value: attributeValues[attributeIndex] ?? "",
      }))
      .filter((row) => row.name.trim() && row.value.trim());

    return {
      sku: skus[index] || undefined,
      name: names[index] || undefined,
      price,
      compareAtPrice: compareAt[index] || undefined,
      quantity: Number(quantities[index] ?? 0),
      attributes,
    };
  });

  // Drop accidental empty "Add another version" cards (no choices / sku / name).
  const filled = variants.filter(
    (variant) =>
      (variant.attributes?.length ?? 0) > 0 ||
      Boolean(variant.sku?.trim()) ||
      Boolean(variant.name?.trim()),
  );
  return filled.length > 0 ? filled : variants;
}

export async function createProductAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const incomplete = findIncompleteChoice(formData);
  if (incomplete) {
    return formErrorState(incomplete.message, formData, {
      choiceErrors: [incomplete.choiceError],
    });
  }

  const mismatched = findMismatchedChoices(formData);
  if (mismatched) {
    return formErrorState(mismatched.message, formData, {
      choiceErrors: mismatched.choiceErrors,
      mismatchVersions: mismatched.mismatchVersions,
    });
  }

  const alt = String(formData.get("imageAlt") ?? "") || undefined;
  const variants = readVariants(formData);
  let images: Array<{ url: string; alt?: string }> = [];
  const variantsWithImages = [];

  const firstAxisName = String(formData.get("primaryAxisName") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const firstAxisValues = String(formData.get("primaryAxisValues") ?? "")
    .split("|||")
    .map((value) => value.trim())
    .filter(Boolean);

  console.info("[admin.createProduct] form variants", {
    count: variants.length,
    variants: variants.map((variant, index) => ({
      index,
      sku: variant.sku,
      price: variant.price,
      quantity: variant.quantity,
      attributes: variant.attributes,
    })),
  });

  try {
    images = await uploadImages(imageFiles(formData, "images"), alt);
    const groupImages: Array<Array<{ url: string; alt?: string }>> = [];
    for (let index = 0; index < firstAxisValues.length; index += 1) {
      groupImages.push(
        await uploadImages(
          imageFiles(formData, `groupImages-${index}`),
          firstAxisValues[index],
        ),
      );
    }

    for (const [index, variant] of variants.entries()) {
      const firstValue = variant.attributes?.find((attribute) => {
        const name = attribute.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");
        return name === firstAxisName;
      })?.value;
      const groupIndex = firstValue
        ? firstAxisValues.findIndex((value) => value === firstValue)
        : -1;
      const fromGroup = groupIndex >= 0 ? groupImages[groupIndex] ?? [] : [];
      const fromVariant = await uploadImages(
        imageFiles(formData, `variantImages-${index}`),
        String(formData.getAll("variantImageAlt")[index] ?? "") || undefined,
      );
      variantsWithImages.push({
        ...variant,
        images: [...fromVariant, ...fromGroup],
      });
    }
  } catch (error) {
    console.error("[admin.createProduct] upload/prepare failed", error);
    redirectAuthErrors(error);
    return adminFormError(error, formData);
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
    imageAlt: alt,
    images,
    variants: variantsWithImages,
  };

  console.info("[admin.createProduct] api payload", {
    name: payload.name,
    slug: payload.slug,
    imageCount: payload.images.length,
    variantCount: payload.variants.length,
    variants: payload.variants.map((variant) => ({
      sku: variant.sku,
      price: variant.price,
      quantity: variant.quantity,
      attributes: variant.attributes,
      imageCount: variant.images?.length ?? 0,
    })),
  });

  let productId: string;
  try {
    const product = await adminCreateProduct(payload);
    productId = product.id;
  } catch (error) {
    console.error("[admin.createProduct] api failed", error);
    redirectAuthErrors(error);
    return adminFormError(error, formData);
  }

  invalidateCatalogCache();
  redirect(
    `/admin/products/${productId}?message=${encodeURIComponent("Product created.")}`,
  );
}

export async function updateProductAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const alt = String(formData.get("imageAlt") ?? "") || undefined;
  let images: Array<{ url: string; alt?: string }> = [];

  try {
    images = await uploadImages(imageFiles(formData, "images"), alt);
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
    imageAlt: alt,
    images,
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

export async function addVariantAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const productId = String(formData.get("productId") ?? "");
  const incomplete = findIncompleteChoice(formData);
  if (incomplete) {
    return formErrorState(incomplete.message, formData, {
      choiceErrors: [incomplete.choiceError],
    });
  }

  const payload = readVariants(formData)[0];

  if (!payload) {
    return formErrorState(
      "Add a price and at least one customer choice value.",
      formData,
      { fields: ["price"] },
    );
  }

  console.info("[admin.addVariant] form payload", {
    productId,
    sku: payload.sku,
    price: payload.price,
    quantity: payload.quantity,
    attributes: payload.attributes,
  });

  let images: Array<{ url: string; alt?: string }> = [];
  try {
    images = await uploadImages(
      imageFiles(formData, "variantImages"),
      String(formData.get("variantImageAlt") ?? "") || undefined,
    );
    await adminAddVariant(productId, { ...payload, images });
  } catch (error) {
    console.error("[admin.addVariant] failed", { productId, error });
    redirectAuthErrors(error);
    return adminFormError(error, formData);
  }

  invalidateCatalogCache();
  redirect(
    `/admin/products/${productId}?message=${encodeURIComponent(
      "Version(s) added. Multiple sizes in one field are split into separate sizes.",
    )}`,
  );
}

export async function expandPackedOptionsAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  try {
    await adminExpandPackedOptions(productId);
  } catch (error) {
    handleAdminError(error, `/admin/products/${productId}`);
  }
  invalidateCatalogCache();
  redirect(
    `/admin/products/${productId}?message=${encodeURIComponent(
      "Each size and color is now its own selectable version.",
    )}`,
  );
}

export async function deleteProductAction(formData: FormData) {
  const id = String(formData.get("productId") ?? "");
  const from = String(formData.get("from") ?? "detail");

  try {
    await adminDeleteProduct(id);
  } catch (error) {
    handleAdminError(
      error,
      from === "list" ? "/admin/products" : `/admin/products/${id}`,
    );
  }

  invalidateCatalogCache();
  redirect(
    `/admin/products?message=${encodeURIComponent("Product deleted.")}`,
  );
}

export async function updateVariantAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const variantId = String(formData.get("variantId") ?? "");
  const payload = readVariants(formData)[0];

  if (!payload) {
    redirect(
      `/admin/products/${productId}?error=${encodeURIComponent("Add a SKU and price.")}`,
    );
  }

  let images: Array<{ url: string; alt?: string }> = [];
  try {
    images = await uploadImages(
      imageFiles(formData, "variantImages"),
      String(formData.get("variantImageAlt") ?? "") || undefined,
    );
    await adminUpdateVariant(productId, variantId, {
      ...payload,
      images,
      isDefault: formData.get("isDefault") === "on",
    });
  } catch (error) {
    handleAdminError(error, `/admin/products/${productId}`);
  }

  invalidateCatalogCache();
  redirect(
    `/admin/products/${productId}?message=${encodeURIComponent("Version updated.")}`,
  );
}

export async function deleteVariantAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const variantId = String(formData.get("variantId") ?? "");

  try {
    await adminDeleteVariant(productId, variantId);
  } catch (error) {
    handleAdminError(error, `/admin/products/${productId}`);
  }

  invalidateCatalogCache();
  redirect(
    `/admin/products/${productId}?message=${encodeURIComponent("Version deleted.")}`,
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

  const stock = String(formData.get("stock") ?? "");
  const q = String(formData.get("q") ?? "");
  const page = String(formData.get("page") ?? "");
  const params = new URLSearchParams();
  if (stock) params.set("stock", stock);
  if (q) params.set("q", q);
  if (page && page !== "1") params.set("page", page);
  params.set("message", "Inventory updated.");
  redirect(`/admin/inventory?${params.toString()}`);
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

function catalogError(error: unknown): { error: string } {
  if (
    error instanceof Error &&
    (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")
  ) {
    handleAdminError(error, "/admin");
  }
  return {
    error: error instanceof Error ? error.message : "Could not save",
  };
}

export async function createCategoryAction(
  formData: FormData,
): Promise<{ id: string; name: string } | { error: string }> {
  try {
    const category = await adminCreateCategory({
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
      parentId: String(formData.get("parentId") ?? "") || undefined,
    });
    updateTag("categories");
    return { id: category.id, name: category.name };
  } catch (error) {
    return catalogError(error);
  }
}

export async function createBrandAction(
  formData: FormData,
): Promise<{ id: string; name: string } | { error: string }> {
  try {
    const brand = await adminCreateBrand({
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
    });
    updateTag("brands");
    return { id: brand.id, name: brand.name };
  } catch (error) {
    return catalogError(error);
  }
}

export async function createCategoryPageAction(formData: FormData) {
  const result = await createCategoryAction(formData);
  if ("error" in result) {
    redirect(`/admin/categories?error=${encodeURIComponent(result.error)}`);
  }
  redirect(`/admin/categories?message=${encodeURIComponent("Category created.")}`);
}

export async function createBrandPageAction(formData: FormData) {
  const result = await createBrandAction(formData);
  if ("error" in result) {
    redirect(`/admin/brands?error=${encodeURIComponent(result.error)}`);
  }
  redirect(`/admin/brands?message=${encodeURIComponent("Brand created.")}`);
}
