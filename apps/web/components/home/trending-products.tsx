import { ProductCard, ProductCardSkeleton } from "@/components/ui/product-card";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types";

type TrendingProductsProps = {
  products: Product[];
};

export function TrendingProducts({ products }: TrendingProductsProps) {
  return (
    <Section
      id="trending"
      eyebrow="Trending"
      title="In the bazaar now"
      description="Live products from the AstraBazaar API — variants, pricing, and stock included."
      headerAction={
        <Button href="/products" variant="secondary" size="sm">
          Shop all
        </Button>
      }
    >
      {products.length === 0 ? (
        <p className="text-body text-foreground-muted">
          No products yet. Seed the catalog API and refresh.
        </p>
      ) : (
        <div className="scrollbar-none -mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-2 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="w-[16rem] shrink-0 snap-start md:w-auto"
            >
              <ProductCard
                product={product}
                returnTo="/"
                priority={index < 2}
              />
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

export function TrendingProductsFallback() {
  return (
    <Section
      eyebrow="Trending"
      title="In the bazaar now"
      description="Loading live catalog…"
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </Section>
  );
}
