import { connection } from "next/server";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { AccountShell } from "./account-shell";

export async function AccountFrame({ children }: { children: ReactNode }) {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <AccountShell signedIn={Boolean(user)}>{children}</AccountShell>;
}
