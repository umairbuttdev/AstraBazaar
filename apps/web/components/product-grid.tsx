import { ProductCard, ProductCardSkeleton } from "@/components/ui/product-card";
import { getProducts } from "@/lib/api";

export async function ProductGrid() {
  const products = await getProducts();

  if (products.length === 0) {
    return (
      <p className="text-foreground-muted">
        No products yet. Seed the catalog API and refresh.
      </p>
    );
  }

  return (
    <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={index < 3} />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridFallback() {
  return (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
