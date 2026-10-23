"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/app/auth/actions";

const links = [
  { href: "/account", label: "Overview", match: (path: string) => path === "/account" },
  { href: "/orders", label: "Orders", match: (path: string) => path.startsWith("/orders") },
  { href: "/wishlist", label: "Wishlist", match: (path: string) => path.startsWith("/wishlist") },
  {
    href: "/account/addresses",
    label: "Addresses",
    match: (path: string) => path.startsWith("/account/addresses"),
  },
  {
    href: "/account/profile",
    label: "Profile",
    match: (path: string) => path.startsWith("/account/profile"),
  },
  {
    href: "/account/settings",
    label: "Settings",
    match: (path: string) => path.startsWith("/account/settings"),
  },
];

function itemClass(active: boolean) {
  return active
    ? "bg-ink text-foam"
    : "text-ink hover:bg-mist";
}

export function AccountShell({
  children,
  signedIn = false,
}: {
  children: ReactNode;
  signedIn?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div>
      <h1 className="font-display text-4xl text-ink md:text-5xl">My account</h1>
      <nav
        aria-label="Account sections"
        className="mt-6 flex flex-wrap gap-2 lg:hidden"
      >
        {links.map((link) => {
          const active = link.match(pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${itemClass(active)}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      {signedIn ? (
        <form action={signOut} className="mt-3 lg:hidden">
          <button
            type="submit"
            className="text-sm font-semibold text-ink underline-offset-4 hover:underline"
          >
            Sign out
          </button>
        </form>
      ) : null}

      <div className="mt-8 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12">
        <nav aria-label="Account" className="hidden lg:block">
          <ul className="space-y-1">
            {links.map((link) => {
              const active = link.match(pathname);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-md px-3 py-2 text-sm font-semibold ${itemClass(active)}`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {signedIn ? (
            <form action={signOut} className="mt-6 border-t border-ink/10 pt-4">
              <button
                type="submit"
                className="px-3 text-sm font-semibold text-ink underline-offset-4 hover:underline"
              >
                Sign out
              </button>
            </form>
          ) : null}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
