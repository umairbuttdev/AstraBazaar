import Link from "next/link";
import { AnnouncementBar } from "@/components/announcement-bar";
import { SearchInput } from "@/components/ui/search-input";

export function SiteHeaderFallback() {
  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md">
      <AnnouncementBar />
      <div className="border-b border-border">
        <div className="container-page flex items-center gap-4 py-3 md:py-4">
          <Link
            href="/"
            className="font-display text-base tracking-[0.14em] text-foreground uppercase md:text-lg"
          >
            AstraBazaar
          </Link>
          <div className="mx-auto hidden min-w-0 flex-1 lg:block lg:max-w-xl">
            <div className="h-10 animate-pulse rounded-md bg-surface-secondary" />
          </div>
          <nav className="ml-auto flex items-center gap-4 text-sm text-foreground-muted">
            <Link href="/login" className="hover:text-foreground">
              Login
            </Link>
            <Link href="/wishlist" className="font-medium text-foreground">
              Wishlist
            </Link>
            <Link href="/cart" className="font-medium text-foreground">
              Cart
            </Link>
          </nav>
        </div>
        <div className="border-t border-border px-4 py-2 lg:hidden">
          <SearchInput id="header-search-fallback" />
        </div>
      </div>
    </header>
  );
}
