import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { OrderCard } from "@/components/order-card";
import { getOrder } from "@/lib/checkout-api";

type OrderPageProps = {
  params: Promise<{ id: string }>;
};

async function OrderContent({ params }: OrderPageProps) {
  await connection();
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/orders"
        className="text-sm text-ink-soft underline underline-offset-4"
      >
        Back to orders
      </Link>

      <div className="mt-6 mb-8">
        <p className="text-sm tracking-[0.2em] text-copper uppercase">Order</p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
          Order details
        </h1>
        <p className="mt-4 text-ink-soft">
          Thanks, {order.fullName}. Track this order below.
        </p>
      </div>

      <OrderCard order={order} />

      <div className="mt-6 rounded-3xl border border-ink/10 bg-foam/80 p-5 md:p-6">
        <h2 className="font-display text-2xl text-ink">Shipping to</h2>
        <div className="mt-4 space-y-1 text-ink-soft">
          <p className="text-ink">{order.fullName}</p>
          <p>{order.line1}</p>
          {order.line2 ? <p>{order.line2}</p> : null}
          <p>
            {order.city}
            {order.state ? `, ${order.state}` : ""} {order.postalCode}
          </p>
          <p>{order.country}</p>
          <p className="pt-2">{order.email}</p>
          {order.phone ? <p>{order.phone}</p> : null}
        </div>
      </div>

      <div className="mt-8">
        <Link
          href="/#catalog"
          className="inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam transition-colors hover:bg-copper"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

export default function OrderPage(props: OrderPageProps) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-16 md:px-10">
      <Suspense fallback={<p className="text-ink-soft">Loading order...</p>}>
        <OrderContent {...props} />
      </Suspense>
    </main>
  );
}
