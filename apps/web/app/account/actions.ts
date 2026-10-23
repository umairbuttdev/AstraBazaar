"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAccountAddress,
  deleteAccountAddress,
  setDefaultAccountAddress,
  updateAccountAddress,
  updateAccountProfile,
} from "@/lib/account-api";
import { createClient } from "@/lib/supabase/server";

export type AccountActionState = {
  error?: string;
  ok?: boolean;
} | null;

function addressInput(formData: FormData) {
  return {
    label: String(formData.get("label") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    line1: String(formData.get("line1") ?? ""),
    line2: String(formData.get("line2") ?? ""),
    city: String(formData.get("city") ?? ""),
    state: String(formData.get("state") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    country: String(formData.get("country") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    isDefault: formData.get("isDefault") === "true",
  };
}

function loginRedirect(next: string): never {
  redirect(
    `/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent("Please login to continue.")}`,
  );
}

function rethrowRedirect(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
  ) {
    throw error;
  }
}

export async function updateProfileAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    loginRedirect("/account/profile");
  }

  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName || null },
  });
  if (error) {
    return { error: error.message };
  }

  try {
    const profile = await updateAccountProfile(fullName);
    if (!profile) loginRedirect("/account/profile");
  } catch (caught) {
    rethrowRedirect(caught);
    if (caught instanceof Error && caught.message === "UNAUTHORIZED") {
      loginRedirect("/account/profile");
    }
    return {
      error: caught instanceof Error ? caught.message : "Could not save your profile.",
    };
  }

  revalidatePath("/account", "layout");
  return { ok: true };
}

export async function saveAddressAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const id = String(formData.get("addressId") ?? "");
  const input = addressInput(formData);
  const next = id ? `/account/addresses/${id}` : "/account/addresses/new";

  try {
    const address = id
      ? await updateAccountAddress(id, input)
      : await createAccountAddress(input);
    if (!address) loginRedirect(next);
    revalidatePath("/account", "layout");
    revalidatePath("/checkout");
    if (!id && address) {
      redirect("/account/addresses?message=Address%20saved.");
    }
  } catch (caught) {
    rethrowRedirect(caught);
    if (caught instanceof Error && caught.message === "UNAUTHORIZED") {
      loginRedirect(next);
    }
    return {
      error: caught instanceof Error ? caught.message : "Could not save this address.",
    };
  }

  return { ok: true };
}

export async function setDefaultAddressAction(formData: FormData) {
  const id = String(formData.get("addressId") ?? "");
  try {
    const address = await setDefaultAccountAddress(id);
    if (!address) loginRedirect("/account/addresses");
  } catch (caught) {
    rethrowRedirect(caught);
    if (caught instanceof Error && caught.message === "UNAUTHORIZED") {
      loginRedirect("/account/addresses");
    }
    const message = caught instanceof Error ? caught.message : "Could not update the default address.";
    redirect(`/account/addresses?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/account", "layout");
  revalidatePath("/checkout");
  redirect("/account/addresses?message=Default%20address%20updated.");
}

export async function deleteAddressAction(formData: FormData) {
  const id = String(formData.get("addressId") ?? "");
  try {
    const result = await deleteAccountAddress(id);
    if (!result) loginRedirect("/account/addresses");
  } catch (caught) {
    rethrowRedirect(caught);
    if (caught instanceof Error && caught.message === "UNAUTHORIZED") {
      loginRedirect("/account/addresses");
    }
    const message = caught instanceof Error ? caught.message : "Could not delete this address.";
    redirect(`/account/addresses?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/account", "layout");
  revalidatePath("/checkout");
  redirect("/account/addresses?message=Address%20deleted.");
}

export async function updatePasswordAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const nextPassword = String(formData.get("nextPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !nextPassword) {
    return { error: "Enter your current password and a new password." };
  }
  if (nextPassword.length < 8) {
    return { error: "Use at least 8 characters for the new password." };
  }
  if (nextPassword !== confirmPassword) {
    return { error: "New password and confirmation do not match." };
  }
  if (nextPassword === currentPassword) {
    return { error: "Choose a different password." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    loginRedirect("/account/settings");
  }

  const { error: currentError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (currentError) {
    return { error: "Current password is incorrect." };
  }

  const { error } = await supabase.auth.updateUser({ password: nextPassword });
  if (error) {
    return { error: error.message };
  }

  return { ok: true };
}
