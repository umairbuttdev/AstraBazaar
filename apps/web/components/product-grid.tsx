import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/api";

function formatPrice(value: string) {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return value;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export async function ProductGrid() {
  const products = await getProducts();

  if (products.length === 0) {
    return (
      <p className="text-ink-soft">
        No products yet. Seed the catalog API and refresh.
      </p>
    );
  }

  return (
    <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product, index) => {
        const image =
          product.images.find((item) => item.isPrimary) ?? product.images[0];
        const defaultVariant =
          product.variants.find((variant) => variant.isDefault) ??
          product.variants[0];

        return (
          <li
            key={product.id}
            className="animate-product-item group"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <Link href={`/products/${product.slug}`} className="block">
              <div className="relative aspect-[4/5] overflow-hidden bg-mist">
                {image ? (
                  <Image
                    src={image.url}
                    alt={image.alt ?? product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                ) : null}
              </div>
              <div className="mt-4 flex items-baseline justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl text-ink">{product.name}</h3>
                  <p className="mt-1 text-sm text-ink-soft">
                    {product.brand?.name ?? "AstraBazaar"}
                  </p>
                </div>
                {defaultVariant ? (
                  <p className="text-sm font-semibold text-ink">
                    {formatPrice(defaultVariant.price)}
                  </p>
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function ProductGridFallback() {
  return (
    <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-[4/5] bg-mist/70" />
          <div className="mt-4 h-5 w-2/3 bg-mist/70" />
          <div className="mt-2 h-4 w-1/3 bg-mist/50" />
        </div>
      ))}
    </div>
  );
}
