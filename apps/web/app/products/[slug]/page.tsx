import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/lib/api";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

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

export async function generateStaticParams() {
  try {
    const products = await getProducts();
    return products.map((product) => ({ slug: product.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;

  try {
    const product = await getProductBySlug(slug);
    return {
      title: product.name,
      description: product.description ?? undefined,
    };
  } catch {
    return {
      title: "Product",
    };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  let product;
  try {
    product = await getProductBySlug(slug);
  } catch {
    notFound();
  }

  const image =
    product.images.find((item) => item.isPrimary) ?? product.images[0];
  const defaultVariant =
    product.variants.find((variant) => variant.isDefault) ??
    product.variants[0];

  return (
    <main className="flex-1">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 md:grid-cols-2 md:gap-16 md:px-10 md:py-20">
        <div className="relative aspect-[4/5] overflow-hidden bg-mist">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt ?? product.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : null}
        </div>

        <div className="flex flex-col justify-center">
          <Link
            href="/#catalog"
            className="text-sm tracking-[0.16em] text-copper uppercase transition-colors hover:text-copper-deep"
          >
            Back to catalog
          </Link>

          <p className="mt-8 text-sm text-ink-soft">
            {product.brand?.name ?? "AstraBazaar"}
            {product.category ? ` · ${product.category.name}` : ""}
          </p>

          <h1 className="mt-3 font-display text-4xl text-ink md:text-6xl">
            {product.name}
          </h1>

          {defaultVariant ? (
            <p className="mt-6 text-2xl font-semibold text-ink">
              {formatPrice(defaultVariant.price)}
              {defaultVariant.compareAtPrice ? (
                <span className="ml-3 text-lg font-normal text-ink-soft line-through">
                  {formatPrice(defaultVariant.compareAtPrice)}
                </span>
              ) : null}
            </p>
          ) : null}

          {product.description ? (
            <p className="mt-6 max-w-md text-base leading-7 text-ink-soft">
              {product.description}
            </p>
          ) : null}

          {product.variants.length > 0 ? (
            <div className="mt-10">
              <p className="text-sm tracking-[0.14em] text-ink-soft uppercase">
                Variants
              </p>
              <ul className="mt-4 space-y-3">
                {product.variants.map((variant) => {
                  const available =
                    (variant.inventory?.quantity ?? 0) -
                    (variant.inventory?.reserved ?? 0);

                  return (
                    <li
                      key={variant.id}
                      className="flex items-center justify-between border-b border-ink/10 py-3"
                    >
                      <div>
                        <p className="font-medium text-ink">
                          {variant.name ?? variant.sku}
                        </p>
                        <p className="text-sm text-ink-soft">{variant.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-ink">
                          {formatPrice(variant.price)}
                        </p>
                        <p className="text-sm text-ink-soft">
                          {available > 0 ? `${available} in stock` : "Sold out"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
