import Link from "next/link";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-24 md:px-10">
      <p className="text-sm tracking-[0.2em] text-copper uppercase">404</p>
      <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
        This page is not in the bazaar
      </h1>
      <p className="mt-4 max-w-xl text-ink-soft">
        The link may be out of date, or the product may no longer be available. You can keep shopping from the catalog.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/products"
          className="inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam hover:bg-copper"
        >
          Browse products
        </Link>
        <Link
          href="/"
          className="inline-flex border border-ink/15 px-5 py-3 text-sm font-semibold text-ink"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
