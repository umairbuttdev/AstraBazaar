"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const groups = [
  {
    label: "Overview",
    links: [{ href: "/admin", label: "Dashboard" }],
  },
  {
    label: "Catalog",
    links: [
      { href: "/admin/products", label: "Products" },
      { href: "/admin/categories", label: "Categories" },
      { href: "/admin/brands", label: "Brands" },
    ],
  },
  {
    label: "Sales",
    links: [
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/customers", label: "Customers" },
    ],
  },
  {
    label: "Inventory",
    links: [{ href: "/admin/inventory", label: "Stock" }],
  },
];

function active(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav aria-label="Operations" className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-xs font-semibold tracking-[0.16em] text-ink-soft uppercase">
            {group.label}
          </p>
          <ul className="mt-2 space-y-1">
            {group.links.map((link) => {
              const current = active(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`block rounded-md px-3 py-2 text-sm font-semibold ${
                      current ? "bg-ink text-foam" : "text-ink hover:bg-mist"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-mist/40">
      <header className="border-b border-ink/10 bg-foam">
        <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md border border-ink/15 px-3 py-2 text-sm font-semibold lg:hidden"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              Menu
            </button>
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-copper uppercase">
                AstraBazaar
              </p>
              <p className="text-sm font-semibold text-ink">Operations</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden max-w-56 truncate text-ink-soft sm:inline">
              {email}
              <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-foam">
                Admin
              </span>
            </span>
            <Link href="/" className="font-semibold text-ink underline-offset-4 hover:underline">
              Storefront
            </Link>
          </div>
        </div>
      </header>
      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className={`${open ? "block" : "hidden"} border-b border-ink/10 bg-foam p-4 lg:block lg:border-r lg:border-b-0`}>
          {nav}
        </aside>
        <main className="min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
