import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCartForm } from "@/components/add-to-cart-form";
import { getProductBySlug, getProducts } from "@/lib/api";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
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

async function ProductDetails({ params, searchParams }: ProductPageProps) {
  const { slug } = await params;
  const query = await searchParams;

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

        <AddToCartForm
          variants={product.variants}
          returnTo={`/products/${product.slug}`}
          error={query.error}
        />
      </div>
    </div>
  );
}

export default function ProductPage(props: ProductPageProps) {
  return (
    <main className="flex-1">
      <Suspense fallback={<p className="p-10 text-ink-soft">Loading product...</p>}>
        <ProductDetails {...props} />
      </Suspense>
    </main>
  );
}
