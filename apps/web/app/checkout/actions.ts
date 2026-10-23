"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { placeOrder } from "@/lib/checkout-api";
import { commerceError } from "@/lib/commerce-errors";

export async function placeOrderAction(formData: FormData) {
  const shipping = {
    email: String(formData.get("email") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    line1: String(formData.get("line1") ?? ""),
    line2: String(formData.get("line2") ?? "") || undefined,
    city: String(formData.get("city") ?? ""),
    state: String(formData.get("state") ?? "") || undefined,
    postalCode: String(formData.get("postalCode") ?? ""),
    country: String(formData.get("country") ?? "US") || "US",
    phone: String(formData.get("phone") ?? "") || undefined,
    paymentMethod: String(formData.get("paymentMethod") ?? "cod"),
    shippingMethod: String(formData.get("shippingMethod") ?? "standard"),
    expectedTotal: String(formData.get("expectedTotal") ?? ""),
  };

  let orderId: string;
  try {
    const order = await placeOrder(shipping);
    if (!order) {
      throw new Error("We couldn't place your order. Please try again.");
    }
    orderId = order.id;
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect(
        `/login?next=${encodeURIComponent("/checkout")}&error=${encodeURIComponent("Please login to checkout.")}`,
      );
    }
    redirect(
      `/checkout?error=${encodeURIComponent(commerceError(error, "We couldn't place your order. Please try again."))}`,
    );
  }

  revalidatePath("/", "layout");
  redirect(`/orders/${orderId}?placed=1`);
}
