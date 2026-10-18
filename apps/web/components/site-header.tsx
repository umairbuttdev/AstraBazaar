import Link from "next/link";
import { connection } from "next/server";
import { getCart } from "@/lib/cart-api";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export async function SiteHeader() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getCurrentProfile() : null;
  const cart = user ? await getCart() : null;
  const itemCount =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <header className="sticky top-0 z-30 border-b border-ink/8 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 md:px-10">
        <Link
          href="/"
          className="font-display text-base tracking-[0.16em] text-ink uppercase md:text-lg"
        >
          AstraBazaar
        </Link>
        <nav className="flex items-center gap-6 text-sm text-ink-soft md:gap-8">
          <Link href="/#catalog" className="transition-colors hover:text-ink">
            Catalog
          </Link>
          <Link href="/cart" className="transition-colors hover:text-ink">
            Cart{itemCount > 0 ? ` (${itemCount})` : ""}
          </Link>
          {user ? (
            <>
              <Link href="/orders" className="transition-colors hover:text-ink">
                Orders
              </Link>
              {profile?.role === "ADMIN" ? (
                <Link href="/admin" className="transition-colors hover:text-ink">
                  Admin
                </Link>
              ) : null}
              <span className="hidden max-w-[12rem] truncate sm:inline">
                {user.email}
              </span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="transition-colors hover:text-ink">
                Login
              </Link>
              <Link href="/signup" className="transition-colors hover:text-ink">
                Signup
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

