import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { setDefaultAddressAction } from "@/app/account/actions";
import { DeleteAddressButton } from "@/components/account/delete-address-button";
import { listAccountAddresses } from "@/lib/account-api";
import { formatAddressLines } from "@/lib/account-types";

export const metadata = { title: "Addresses" };

type AddressesPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

async function AddressesContent({ searchParams }: AddressesPageProps) {
  await connection();
  const params = await searchParams;
  let addresses = null;
  let loadError: string | null = null;
  try {
    addresses = await listAccountAddresses();
  } catch {
    loadError = "Unable to load your addresses right now.";
  }

  if (loadError) {
    return (
      <div>
        <h2 className="font-display text-3xl text-ink">Addresses</h2>
        <p className="mt-3 text-ink-soft">{loadError}</p>
        <Link href="/account/addresses" className="mt-6 inline-flex text-sm font-semibold underline underline-offset-4">
          Try again
        </Link>
      </div>
    );
  }

  if (!addresses) {
    return (
      <div>
        <h2 className="font-display text-3xl text-ink">Addresses</h2>
        <p className="mt-3 text-ink-soft">Login to manage your addresses.</p>
        <Link
          href="/login?next=%2Faccount%2Faddresses"
          className="mt-6 inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam hover:bg-copper"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-ink">Addresses</h2>
          <p className="mt-3 text-ink-soft">
            Saved addresses are available at checkout. Orders keep their own copy.
          </p>
        </div>
        <Link
          href="/account/addresses/new"
          className="inline-flex bg-ink px-4 py-2.5 text-sm font-semibold text-foam hover:bg-copper"
        >
          Add address
        </Link>
      </div>
      {params.error ? (
        <p role="alert" className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {params.error}
        </p>
      ) : null}
      {params.message ? (
        <p role="status" className="mt-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {params.message}
        </p>
      ) : null}
      {addresses.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-ink/15 px-6 py-12 text-center">
          <h3 className="font-display text-2xl text-ink">No saved addresses</h3>
          <p className="mt-2 text-ink-soft">Add an address to use it the next time you check out.</p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4">
          {addresses.map((address) => (
            <li key={address.id} className="rounded-3xl border border-ink/10 bg-foam p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{address.label || "Address"}</p>
                  {address.isDefault ? (
                    <p className="mt-1 text-xs font-semibold tracking-wide text-copper uppercase">
                      Default
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 text-sm text-ink-soft">
                <p className="text-ink">{address.fullName}</p>
                {address.phone ? <p>{address.phone}</p> : null}
                {formatAddressLines(address).map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <Link
                  href={`/account/addresses/${address.id}`}
                  className="text-sm font-semibold underline underline-offset-4"
                >
                  Edit
                </Link>
                <DeleteAddressButton addressId={address.id} />
                {address.isDefault ? null : (
                  <form action={setDefaultAddressAction}>
                    <input type="hidden" name="addressId" value={address.id} />
                    <button type="submit" className="text-sm font-semibold underline underline-offset-4">
                      Set as default
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AddressesPage(props: AddressesPageProps) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading addresses...</p>}>
      <AddressesContent {...props} />
    </Suspense>
  );
}
