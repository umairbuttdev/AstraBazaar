import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AddressForm } from "@/components/account/address-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Add address" };

async function NewAddressContent() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div>
        <h2 className="font-display text-3xl text-ink">Add address</h2>
        <p className="mt-3 text-ink-soft">Login to save an address.</p>
        <Link
          href="/login?next=%2Faccount%2Faddresses%2Fnew"
          className="mt-6 inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam hover:bg-copper"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-3xl text-ink">Add address</h2>
      <div className="mt-8">
        <AddressForm />
      </div>
    </div>
  );
}

export default function NewAddressPage() {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading address form...</p>}>
      <NewAddressContent />
    </Suspense>
  );
}
