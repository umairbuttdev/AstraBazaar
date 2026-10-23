"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveAddressAction } from "@/app/account/actions";
import type { AccountAddress } from "@/lib/account-types";

const fieldClass =
  "mt-2 w-full rounded-md border border-border bg-surface px-4 py-3 text-foreground outline-none transition focus:border-primary";

export function AddressForm({ address }: { address?: AccountAddress }) {
  const [state, action, pending] = useActionState(saveAddressAction, null);

  return (
    <form action={action} className="max-w-xl space-y-4">
      {address ? <input type="hidden" name="addressId" value={address.id} /> : null}
      <label className="block">
        <span className="text-sm font-medium">
          Label <span className="text-ink-soft">(optional)</span>
        </span>
        <input
          name="label"
          maxLength={40}
          defaultValue={address?.label ?? ""}
          placeholder="Home"
          className={fieldClass}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">
          Full name <span className="text-red-800">*</span>
        </span>
        <input
          name="fullName"
          required
          autoComplete="name"
          maxLength={120}
          defaultValue={address?.fullName ?? ""}
          className={fieldClass}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">
          Phone <span className="text-ink-soft">(optional)</span>
        </span>
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={address?.phone ?? ""}
          className={fieldClass}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">
          Address <span className="text-red-800">*</span>
        </span>
        <input
          name="line1"
          required
          autoComplete="address-line1"
          maxLength={200}
          defaultValue={address?.line1 ?? ""}
          className={fieldClass}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">
          Apartment, suite <span className="text-ink-soft">(optional)</span>
        </span>
        <input
          name="line2"
          autoComplete="address-line2"
          maxLength={200}
          defaultValue={address?.line2 ?? ""}
          className={fieldClass}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">
            City <span className="text-red-800">*</span>
          </span>
          <input
            name="city"
            required
            autoComplete="address-level2"
            maxLength={100}
            defaultValue={address?.city ?? ""}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">
            State <span className="text-ink-soft">(optional)</span>
          </span>
          <input
            name="state"
            autoComplete="address-level1"
            maxLength={100}
            defaultValue={address?.state ?? ""}
            className={fieldClass}
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">
            Postal code <span className="text-red-800">*</span>
          </span>
          <input
            name="postalCode"
            required
            autoComplete="postal-code"
            maxLength={20}
            defaultValue={address?.postalCode ?? ""}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">
            Country <span className="text-red-800">*</span>
          </span>
          <input
            name="country"
            required
            autoComplete="country"
            maxLength={56}
            defaultValue={address?.country ?? "US"}
            className={fieldClass}
          />
        </label>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="isDefault"
          value="true"
          defaultChecked={address?.isDefault ?? false}
        />
        Use as the default delivery address
      </label>
      {state?.error ? (
        <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p role="status" className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Address saved.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam hover:bg-copper disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save address"}
        </button>
        <Link
          href="/account/addresses"
          className="inline-flex border border-ink/15 px-5 py-3 text-sm font-semibold text-ink"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
