import { Suspense } from "react";
import { Hero } from "@/components/hero";
import { ProductGrid, ProductGridFallback } from "@/components/product-grid";

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />

      <section
        id="catalog"
        className="mx-auto w-full max-w-7xl px-6 py-20 md:px-10 md:py-28"
      >
        <div className="mb-12 max-w-2xl">
          <p className="text-sm tracking-[0.2em] text-copper uppercase">Catalog</p>
          <h2 className="mt-3 font-display text-4xl text-ink md:text-5xl">
            In the bazaar now
          </h2>
          <p className="mt-4 text-base leading-7 text-ink-soft md:text-lg">
            Live products from the AstraBazaar API — variants, pricing, and stock
            included.
          </p>
        </div>

        <Suspense fallback={<ProductGridFallback />}>
          <ProductGrid />
        </Suspense>
      </section>
    </main>
  );
}
