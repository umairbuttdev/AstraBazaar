import Link from "next/link";
import {
  adminListInventory,
  adminListOrders,
  adminListProducts,
} from "@/lib/admin-api";

export default async function AdminHomePage() {
  const [products, inventory, orders] = await Promise.all([
    adminListProducts(),
    adminListInventory(),
    adminListOrders(),
  ]);

  const lowStock = inventory.filter((row) => row.available <= 5).length;
  const openOrders = orders.filter(
    (order) =>
      order.status !== "FULFILLED" && order.status !== "CANCELLED",
  ).length;

  const cards = [
    {
      href: "/admin/products",
      label: "Products",
      value: String(products.length),
      hint: "Create and publish catalog items",
    },
    {
      href: "/admin/inventory",
      label: "Inventory",
      value: String(inventory.length),
      hint:
        lowStock > 0
          ? `${lowStock} variant${lowStock === 1 ? "" : "s"} at or below 5 units`
          : "All variants above low-stock threshold",
    },
    {
      href: "/admin/orders",
      label: "Orders",
      value: String(orders.length),
      hint:
        openOrders > 0
          ? `${openOrders} open order${openOrders === 1 ? "" : "s"} to fulfill`
          : "No open orders",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {cards.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className="border border-ink/10 bg-foam/60 p-6 transition-colors hover:border-copper"
        >
          <p className="text-sm tracking-[0.16em] text-ink-soft uppercase">
            {card.label}
          </p>
          <p className="mt-4 font-display text-4xl text-ink">{card.value}</p>
          <p className="mt-3 text-sm text-ink-soft">{card.hint}</p>
        </Link>
      ))}
    </div>
  );
}
