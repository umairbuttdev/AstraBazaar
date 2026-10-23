import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  AccountAddress,
  AccountProfile,
  AccountSummary,
} from "./account-types";

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

async function accountFetch<T>(
  path: string,
  init?: RequestInit & {
    allowUnauthorized?: boolean;
    allowNotFound?: boolean;
  },
): Promise<T | null> {
  const token = await getAccessToken();
  if (!token) {
    if (init?.allowUnauthorized) return null;
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
    if (init?.allowUnauthorized) return null;
    throw new Error("UNAUTHORIZED");
  }

  if (response.status === 404 && init?.allowNotFound) {
    return null;
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : body?.message;
    throw new Error(message ?? `Account API failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getAccountSummary() {
  return accountFetch<AccountSummary>("/account", { allowUnauthorized: true });
}

export function getAccountProfile() {
  return accountFetch<AccountProfile>("/account/profile", {
    allowUnauthorized: true,
  });
}

export function updateAccountProfile(fullName: string) {
  return accountFetch<AccountProfile>("/account/profile", {
    method: "PATCH",
    body: JSON.stringify({ fullName }),
  });
}

export function listAccountAddresses() {
  return accountFetch<AccountAddress[]>("/account/addresses", {
    allowUnauthorized: true,
  });
}

export function getAccountAddress(id: string) {
  return accountFetch<AccountAddress>(`/account/addresses/${id}`, {
    allowUnauthorized: true,
    allowNotFound: true,
  });
}

export function createAccountAddress(input: Record<string, unknown>) {
  return accountFetch<AccountAddress>("/account/addresses", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAccountAddress(id: string, input: Record<string, unknown>) {
  return accountFetch<AccountAddress>(`/account/addresses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function setDefaultAccountAddress(id: string) {
  return accountFetch<AccountAddress>(`/account/addresses/${id}/default`, {
    method: "POST",
  });
}

export function deleteAccountAddress(id: string) {
  return accountFetch<{ ok: boolean; id: string }>(`/account/addresses/${id}`, {
    method: "DELETE",
  });
}
