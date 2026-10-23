import Link from "next/link";
import { connection } from "next/server";
import { AnnouncementBar } from "@/components/announcement-bar";
import { CategoryNav } from "@/components/category-nav";
import { MobileNav } from "@/components/mobile-nav";
import { SearchInput } from "@/components/ui/search-input";
import { getCategories } from "@/lib/api";
import {
  buildCategoryTree,
  categoryCountMap,
  pruneEmptyCategories,
} from "@/lib/category-tree";
import { getCart } from "@/lib/cart-api";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { getWishlist } from "@/lib/wishlist-api";
import { SignOutButton } from "./sign-out-button";

export async function SiteHeader() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getCurrentProfile() : null;
  const cart = user ? await getCart() : null;
  const wishlist = user ? await getWishlist() : null;
  const itemCount = cart?.itemCount ?? 0;
  const savedCount = wishlist?.itemCount ?? 0;

  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  try {
    categories = await getCategories();
  } catch {
    categories = [];
  }

  const categoryTree = pruneEmptyCategories(
    buildCategoryTree(categories),
    categoryCountMap(categories),
  );
  const extraLinks = [
    { href: "/products", label: "All products" },
    { href: "/products?sort=newest", label: "New arrivals" },
    { href: "/#trending", label: "Best sellers" },
    { href: "/products?deals=1", label: "Deals" },
  ];

  const accountLinks = user
    ? [
        { href: "/account", label: "My Account" },
        { href: "/orders", label: "Orders" },
        { href: "/wishlist", label: `Wishlist${savedCount > 0 ? ` (${savedCount})` : ""}` },
        { href: "/account/addresses", label: "Addresses" },
        ...(profile?.role === "ADMIN"
          ? [{ href: "/admin", label: "Admin" }]
          : []),
        { href: "/cart", label: `Cart${itemCount > 0 ? ` (${itemCount})` : ""}` },
      ]
    : [
        { href: "/login", label: "Login" },
        { href: "/signup", label: "Sign up" },
        { href: "/wishlist", label: "Wishlist" },
        { href: "/cart", label: "Cart" },
      ];

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md">
      <AnnouncementBar />

      <div className="relative border-b border-border">
        <div className="container-page flex items-center gap-4 py-2.5 md:gap-6 md:py-3">
          <Link
            href="/"
            className="font-display shrink-0 text-base tracking-[0.14em] text-foreground uppercase md:text-lg"
          >
            AstraBazaar
          </Link>

          <div className="mx-auto hidden min-w-0 flex-1 lg:block lg:max-w-xl">
            <SearchInput
              id="header-search"
              placeholder="Search products, categories…"
            />
          </div>

          <nav
            className="ml-auto flex items-center gap-3 text-sm text-foreground-muted md:gap-4"
            aria-label="Account"
          >
            <Link
              href={user ? "/account" : "/login"}
              className="hidden transition-colors hover:text-foreground sm:inline"
            >
              {user ? "Account" : "Login"}
            </Link>
            {user && profile?.role === "ADMIN" ? (
              <Link
                href="/admin"
                className="hidden transition-colors hover:text-foreground md:inline"
              >
                Admin
              </Link>
            ) : null}
            <Link
              href="/wishlist"
              aria-label={
                savedCount > 0 ? `Wishlist, ${savedCount} saved` : "Wishlist"
              }
              className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
            >
              <span className="hidden sm:inline">Wishlist</span>
              <span className="sm:hidden" aria-hidden="true">
                ♡
              </span>
              {savedCount > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-foam">
                  {savedCount}
                </span>
              ) : null}
            </Link>
            <Link
              href="/cart"
              className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
            >
              Cart
              {itemCount > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-foam">
                  {itemCount}
                </span>
              ) : null}
            </Link>
            {user ? (
              <span className="hidden items-center gap-3 lg:flex">
                <span className="max-w-[10rem] truncate text-xs">
                  {user.email}
                </span>
                <SignOutButton />
              </span>
            ) : (
              <Link
                href="/signup"
                className="hidden transition-colors hover:text-foreground md:inline"
              >
                Sign up
              </Link>
            )}
            <MobileNav
              categories={categoryTree}
              extraLinks={extraLinks}
              accountLinks={accountLinks}
            />
          </nav>
        </div>

        <div className="hidden border-t border-border lg:block">
          <nav aria-label="Primary">
            <CategoryNav categories={categoryTree} />
          </nav>
        </div>

        <div className="border-t border-border px-4 py-2 lg:hidden">
          <SearchInput id="header-search-mobile" placeholder="Search products…" />
        </div>
      </div>
    </header>
  );
}
