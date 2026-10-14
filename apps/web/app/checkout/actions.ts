"use server";

import { redirect } from "next/navigation";
import { placeOrder } from "@/lib/checkout-api";

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
  };

  let orderId: string;
  try {
    const order = await placeOrder(shipping);
    if (!order) {
      throw new Error("Could not place order");
    }
    orderId = order.id;
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect(
        `/login?error=${encodeURIComponent("Please login to checkout.")}`,
      );
    }
    const message =
      error instanceof Error ? error.message : "Could not place order";
    redirect(`/checkout?error=${encodeURIComponent(message)}`);
  }

  redirect(`/orders/${orderId}`);
}
