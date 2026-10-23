"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { useFormStatus } from "react-dom";
import { placeOrderAction } from "@/app/checkout/actions";
import { formatMoney } from "@/lib/product-pricing";
import type { CheckoutQuote, SavedAddress } from "@/lib/checkout-types";

type CheckoutFormProps = {
  quote: CheckoutQuote;
  addresses: SavedAddress[];
  email: string;
  fullName: string;
};

const fieldClass =
  "mt-2 w-full rounded-md border border-border bg-surface px-4 py-3 text-foreground outline-none transition focus:border-primary";

function PlaceOrderButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-ink px-5 text-sm font-semibold text-foam transition-colors hover:bg-copper disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Placing order…" : "Place order"}
    </button>
  );
}

function attributeLines(attributes: CheckoutQuote["items"][number]["attributes"]) {
  if (!attributes || Array.isArray(attributes)) return [];
  return Object.entries(attributes).filter(
    (entry): entry is [string, string | number] =>
      typeof entry[1] === "string" || typeof entry[1] === "number",
  );
}

export function CheckoutForm({
  quote,
  addresses,
  email,
  fullName,
}: CheckoutFormProps) {
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? "new");
  const [paymentMethod, setPaymentMethod] = useState("cod");

  useEffect(() => {
    track("checkout_started", {
      itemCount: quote.items.length,
      total: quote.total,
      currency: quote.currency,
    });
    track("checkout_shipping_selected", { method: quote.shipping.id });
  }, [quote.currency, quote.items.length, quote.shipping.id, quote.total]);

  useEffect(() => {
    track("checkout_address_selected", { saved: addressId !== "new" });
  }, [addressId]);

  useEffect(() => {
    track("checkout_payment_selected", { method: paymentMethod });
  }, [paymentMethod]);
  const selected = addresses.find((address) => address.id === addressId);
  const online = quote.paymentMethods.find((method) => method.id === "online");
  const blocked = !quote.ready || paymentMethod !== "cod";

  return (
    <form id="checkout-form" action={placeOrderAction} className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <input type="hidden" name="expectedTotal" value={quote.total} />
      <div className="space-y-10">
        <section>
          <h2 className="text-h3">Delivery address</h2>
          <p className="text-body-sm mt-2 text-foreground-muted">
            This address is saved on your account and copied onto the order.
          </p>
          {addresses.length > 0 ? (
            <fieldset className="mt-4 space-y-3">
              <legend className="sr-only">Saved addresses</legend>
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={`block cursor-pointer rounded-lg border p-4 ${
                    addressId === address.id
                      ? "border-primary bg-surface"
                      : "border-border bg-surface"
                  }`}
                >
                  <span className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="savedAddress"
                      value={address.id}
                      checked={addressId === address.id}
                      onChange={() => setAddressId(address.id)}
                      className="mt-1"
                    />
                    <span>
                      {address.label ? (
                        <span className="text-caption text-foreground-muted">
                          {address.label}
                        </span>
                      ) : null}
                      <span className="block font-semibold">{address.fullName}</span>
                      <span className="text-body-sm mt-1 block text-foreground-muted">
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""}
                        {", "}
                        {address.city}
                        {address.state ? `, ${address.state}` : ""} {address.postalCode}
                      </span>
                      {address.phone ? (
                        <span className="text-body-sm mt-1 block text-foreground-muted">
                          {address.phone}
                        </span>
                      ) : null}
                      {address.isDefault ? (
                        <span className="mt-2 inline-flex rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-foam">
                          Default
                        </span>
                      ) : null}
                    </span>
                  </span>
                </label>
              ))}
              <label
                className={`block cursor-pointer rounded-lg border p-4 ${
                  addressId === "new" ? "border-primary" : "border-border"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="savedAddress"
                    value="new"
                    checked={addressId === "new"}
                    onChange={() => setAddressId("new")}
                  />
                  <span className="font-semibold">Use a new address</span>
                </span>
              </label>
            </fieldset>
          ) : null}

          <div key={addressId} className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-medium">Email</span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                defaultValue={email}
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Full name</span>
              <input
                type="text"
                name="fullName"
                required
                autoComplete="name"
                defaultValue={selected?.fullName ?? fullName}
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Address</span>
              <input
                type="text"
                name="line1"
                required
                autoComplete="address-line1"
                defaultValue={selected?.line1 ?? ""}
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Apartment, suite (optional)</span>
              <input
                type="text"
                name="line2"
                autoComplete="address-line2"
                defaultValue={selected?.line2 ?? ""}
                className={fieldClass}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">City</span>
                <input
                  type="text"
                  name="city"
                  required
                  autoComplete="address-level2"
                  defaultValue={selected?.city ?? ""}
                  className={fieldClass}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">State</span>
                <input
                  type="text"
                  name="state"
                  autoComplete="address-level1"
                  defaultValue={selected?.state ?? ""}
                  className={fieldClass}
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Postal code</span>
                <input
                  type="text"
                  name="postalCode"
                  required
                  autoComplete="postal-code"
                  defaultValue={selected?.postalCode ?? ""}
                  className={fieldClass}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Country</span>
                <input
                  type="text"
                  name="country"
                  required
                  autoComplete="country"
                  defaultValue={selected?.country ?? "US"}
                  className={fieldClass}
                />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium">Phone (optional)</span>
              <input
                type="tel"
                name="phone"
                autoComplete="tel"
                defaultValue={selected?.phone ?? ""}
                className={fieldClass}
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-h3">Shipping method</h2>
          <fieldset className="mt-4 space-y-3">
            <legend className="sr-only">Shipping method</legend>
            {quote.shippingMethods.map((method) => (
              <label
                key={method.id}
                className="block cursor-pointer rounded-lg border border-primary bg-surface p-4"
              >
                <span className="flex items-start justify-between gap-4">
                  <span className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={method.id}
                      defaultChecked
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-semibold">{method.name}</span>
                      <span className="text-body-sm mt-1 block text-foreground-muted">
                        {method.estimate ?? "Delivery timing is confirmed after the order is placed."}
                      </span>
                    </span>
                  </span>
                  <span className="font-semibold">{formatMoney(method.amount)}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </section>

        <section>
          <h2 className="text-h3">Payment method</h2>
          <fieldset className="mt-4 space-y-3">
            <legend className="sr-only">Payment method</legend>
            {quote.paymentMethods.map((method) => {
              const selectedMethod = paymentMethod === method.id;
              return (
                <label
                  key={method.id}
                  className={`block rounded-lg border p-4 ${
                    method.available ? "cursor-pointer" : "cursor-not-allowed opacity-70"
                  } ${selectedMethod && method.available ? "border-primary bg-surface" : "border-border bg-surface"}`}
                >
                  <span className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={selectedMethod}
                      disabled={!method.available}
                      onChange={() => setPaymentMethod(method.id)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-semibold">{method.name}</span>
                      <span className="text-body-sm mt-1 block text-foreground-muted">
                        {method.detail}
                      </span>
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>
          {paymentMethod === "online" && online ? (
            <p className="text-body-sm mt-3 text-foreground" role="status">
              {online.detail} Cash on delivery can be used instead.
            </p>
          ) : null}
        </section>
      </div>

      <aside className="h-fit rounded-lg border border-border bg-surface-secondary p-5 lg:sticky lg:top-36">
        <h2 className="text-h3">Order summary</h2>
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {quote.items.map((item) => (
            <li key={item.id} className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <ul className="text-body-sm mt-1 text-foreground-muted">
                    {attributeLines(item.attributes).length > 0 ? (
                      attributeLines(item.attributes).map(([key, value]) => (
                        <li key={key}>
                          {key.charAt(0).toUpperCase()}
                          {key.slice(1)}: {value}
                        </li>
                      ))
                    ) : (
                      <li>{item.variantName ?? item.sku}</li>
                    )}
                    <li>Qty {item.quantity}</li>
                  </ul>
                </div>
                <p className="shrink-0 font-semibold">{formatMoney(item.lineTotal)}</p>
              </div>
              {item.issue ? (
                <p className="text-body-sm mt-2 font-medium text-red-700">{item.issue}</p>
              ) : null}
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-foreground-muted">Subtotal</dt>
            <dd>{formatMoney(quote.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-foreground-muted">Shipping</dt>
            <dd>{formatMoney(quote.shipping.amount)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-3 text-base">
            <dt className="font-semibold">Total</dt>
            <dd className="text-price">{formatMoney(quote.total)}</dd>
          </div>
        </dl>
        {quote.issues.length > 0 ? (
          <div className="mt-4 space-y-2" role="alert">
            {quote.issues.map((issue) => (
              <p key={issue} className="text-body-sm font-medium text-red-700">
                {issue}
              </p>
            ))}
          </div>
        ) : null}
        <div className="mt-6 hidden md:block">
          <PlaceOrderButton disabled={blocked} />
        </div>
        <p className="text-body-sm mt-4 text-foreground-muted">
          The total is calculated by the store when the order is placed.
        </p>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-body-sm text-foreground-muted">Total</p>
            <p className="text-price">{formatMoney(quote.total)}</p>
          </div>
          <div className="w-40">
            <PlaceOrderButton disabled={blocked} />
          </div>
        </div>
      </div>
    </form>
  );
}
