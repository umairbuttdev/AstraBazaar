import Link from "next/link";

export function SiteHeaderFallback() {
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
          <Link href="/login" className="transition-colors hover:text-ink">
            Login
          </Link>
          <Link href="/signup" className="transition-colors hover:text-ink">
            Signup
          </Link>
        </nav>
      </div>
    </header>
  );
}
