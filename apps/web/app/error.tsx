"use client";

import Link from "next/link";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-24">
      <p className="text-sm tracking-[0.2em] text-copper uppercase">Store</p>
      <h1 className="mt-3 font-display text-4xl text-ink">This page didn’t load</h1>
      <p className="mt-4 text-ink-soft">
        Something went wrong while loading the store. You can try again, or go back to shopping.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-ink px-5 py-3 text-sm font-semibold text-foam hover:bg-copper"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border border-ink/15 px-5 py-3 text-sm font-semibold text-ink"
        >
          Back to AstraBazaar
        </Link>
      </div>
    </main>
  );
}
