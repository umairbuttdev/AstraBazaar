"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addCartItem } from "@/lib/cart-api";
import { commerceError } from "@/lib/commerce-errors";
import { safeNext } from "@/lib/safe-next";

export type ProductCartState = {
  status: "idle" | "added" | "error";
  message?: string;
};

export async function addProductToCartAction(
  _previous: ProductCartState,
  formData: FormData,
): Promise<ProductCartState> {
  const variantId = String(formData.get("variantId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const intent = String(formData.get("intent") ?? "cart");
  const returnTo = safeNext(formData.get("returnTo") ?? "/");

  if (!variantId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    return { status: "error", message: "Choose a valid quantity." };
  }

  try {
    await addCartItem(variantId, quantity);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect(
        `/login?next=${encodeURIComponent(returnTo)}&error=${encodeURIComponent("Please login to add items to your cart.")}`,
      );
    }
    return {
      status: "error",
      message: commerceError(
        error,
        "We couldn't update your cart. Please try again.",
      ),
    };
  }

  revalidatePath("/", "layout");

  if (intent === "buy") {
    redirect("/checkout");
  }

  return { status: "added", message: "Added to your cart." };
}
