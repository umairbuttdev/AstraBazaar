import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-24 md:px-10">
      <p className="text-sm tracking-[0.2em] text-copper uppercase">404</p>
      <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
        Not in the bazaar
      </h1>
      <p className="mt-4 text-ink-soft">
        That product could not be found. Browse the live catalog instead.
      </p>
      <Link
        href="/#catalog"
        className="mt-8 inline-flex w-fit bg-ink px-5 py-3 text-sm font-semibold text-foam transition-colors hover:bg-copper"
      >
        View catalog
      </Link>
    </main>
  );
}
