import Link from "next/link";
import { ProductImage } from "@/components/product-image";

type CategoryCardProps = {
  name: string;
  slug: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  productCount?: number;
};

export function CategoryCard({
  name,
  slug,
  imageUrl,
  imageAlt,
  productCount,
}: CategoryCardProps) {
  return (
    <Link
      href={`/categories/${slug}`}
      className="group relative block w-[9.5rem] shrink-0 snap-start overflow-hidden rounded-md sm:w-[11rem] md:w-auto"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-secondary">
        <ProductImage
          src={imageUrl}
          alt={imageAlt ?? name}
          fill
          sizes="(max-width: 768px) 40vw, 16vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
          <p className="text-sm font-semibold text-foam">{name}</p>
          {typeof productCount === "number" ? (
            <p className="mt-0.5 text-xs text-foam/75">
              {productCount} {productCount === 1 ? "item" : "items"}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
