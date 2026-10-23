import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { OrderSummaryCard } from "@/components/orders/order-summary-card";
import { getAccountSummary } from "@/lib/account-api";
import {
  accountDisplayName,
  accountFirstName,
  accountInitials,
  formatAddressLines,
} from "@/lib/account-types";
import { listOrders } from "@/lib/checkout-api";

async function OverviewContent() {
  await connection();
  const [summary, orders] = await Promise.all([
    getAccountSummary().catch(() => null),
    listOrders({ limit: 3 }).catch(() => null),
  ]);

  if (!summary) {
    return (
      <div className="max-w-xl">
        <h2 className="font-display text-3xl text-ink">Sign in</h2>
        <p className="mt-3 text-ink-soft">Login to view your account.</p>
        <Link
          href="/login?next=%2Faccount"
          className="mt-6 inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam hover:bg-copper"
        >
          Login
        </Link>
      </div>
    );
  }

  const recent = orders?.items.slice(0, 3) ?? [];

  return (
    <div className="space-y-8">
      <section className="flex items-center gap-4">
        <span
          aria-hidden
          className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-lg font-semibold text-foam"
        >
          {accountInitials(summary)}
        </span>
        <div>
          <p className="text-sm tracking-[0.16em] text-copper uppercase">Welcome back</p>
          <h2 className="font-display text-3xl text-ink">
            {accountFirstName(summary)}
          </h2>
          <p className="text-sm text-ink-soft">{summary.email}</p>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl text-ink">Recent orders</h2>
          <Link href="/orders" className="text-sm font-semibold underline underline-offset-4">
            View all orders
          </Link>
        </div>
        {orders === null ? (
          <p className="mt-4 text-sm text-ink-soft">Unable to load your orders right now.</p>
        ) : recent.length === 0 ? (
          <div className="mt-4 rounded-3xl border border-dashed border-ink/15 px-5 py-8">
            <p className="text-ink-soft">No orders yet.</p>
            <Link href="/products" className="mt-4 inline-flex text-sm font-semibold underline underline-offset-4">
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {recent.map((order) => (
              <li key={order.id}>
                <OrderSummaryCard order={order} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl text-ink">Quick actions</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { href: "/orders", label: "View orders" },
            { href: "/account/addresses", label: "Manage addresses" },
            {
              href: "/wishlist",
              label: `View wishlist${summary.wishlistCount > 0 ? ` (${summary.wishlistCount})` : ""}`,
            },
            { href: "/account/profile", label: "Edit profile" },
          ].map((action) => (
            <li key={action.href}>
              <Link
                href={action.href}
                className="block rounded-2xl border border-ink/10 bg-foam px-4 py-4 text-sm font-semibold hover:border-copper"
              >
                {action.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-ink/10 bg-foam p-5">
        <h2 className="font-display text-2xl text-ink">Account summary</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-ink-soft">Name</dt>
            <dd className="text-ink">{accountDisplayName(summary)}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Email</dt>
            <dd className="break-all text-ink">{summary.email}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Default address</dt>
            <dd className="text-ink">
              {summary.defaultAddress
                ? formatAddressLines(summary.defaultAddress).join(", ")
                : "No default address yet"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-soft">Wishlist</dt>
            <dd className="text-ink">
              {summary.wishlistCount} saved{" "}
              {summary.wishlistCount === 1 ? "item" : "items"}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading your account...</p>}>
      <OverviewContent />
    </Suspense>
  );
}
