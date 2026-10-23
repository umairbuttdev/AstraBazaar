import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AddressForm } from "@/components/account/address-form";
import { getAccountAddress } from "@/lib/account-api";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit address" };

async function EditAddressContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div>
        <h2 className="font-display text-3xl text-ink">Edit address</h2>
        <p className="mt-3 text-ink-soft">Login to edit this address.</p>
        <Link
          href={`/login?next=${encodeURIComponent(`/account/addresses/${id}`)}`}
          className="mt-6 inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam hover:bg-copper"
        >
          Login
        </Link>
      </div>
    );
  }

  let address = null;
  try {
    address = await getAccountAddress(id);
  } catch {
    return (
      <div>
        <h2 className="font-display text-3xl text-ink">Edit address</h2>
        <p className="mt-3 text-ink-soft">Unable to load this address right now.</p>
        <Link href={`/account/addresses/${id}`} className="mt-6 inline-flex text-sm font-semibold underline underline-offset-4">
          Try again
        </Link>
      </div>
    );
  }

  if (!address) {
    return (
      <div>
        <h2 className="font-display text-3xl text-ink">Address not found</h2>
        <p className="mt-3 text-ink-soft">This address could not be found.</p>
        <Link href="/account/addresses" className="mt-6 inline-flex text-sm font-semibold underline underline-offset-4">
          Back to addresses
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-3xl text-ink">Edit address</h2>
      <div className="mt-8">
        <AddressForm address={address} />
      </div>
    </div>
  );
}

export default function EditAddressPage(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading address...</p>}>
      <EditAddressContent {...props} />
    </Suspense>
  );
}
