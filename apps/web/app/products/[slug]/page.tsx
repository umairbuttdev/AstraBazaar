import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TrackView } from "@/components/analytics/track-view";
import { ProductView } from "@/components/product/product-view";
import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { ProductCard, ProductCardSkeleton } from "@/components/ui/product-card";
import {
  getAllProductSlugs,
  getPrimaryImage,
  getProductBySlug,
  getProductListing,
} from "@/lib/api";
import { siteUrl } from "@/lib/site";
import { breadcrumbStructuredData, productStructuredData } from "@/lib/structured-data";
import type { Product } from "@/lib/types";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string }>;
};

export async function generateStaticParams() {
  try {
    const slugs = await getAllProductSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;

  try {
    const product = await getProductBySlug(slug);
    const image = getPrimaryImage(product);
    const description = product.description ?? `${product.name} at AstraBazaar.`;
    return {
      title: product.name,
      description,
      alternates: { canonical: `/products/${product.slug}` },
      openGraph: {
        title: product.name,
        description,
        url: `/products/${product.slug}`,
        images: image?.url ? [{ url: image.url, alt: image.alt ?? product.name }] : undefined,
      },
    };
  } catch {
    return { title: "Product" };
  }
}

function ProductSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="aspect-[4/5] animate-pulse rounded-lg bg-surface-secondary" />
      <div className="space-y-4">
        <div className="h-4 w-24 animate-pulse rounded bg-surface-secondary" />
        <div className="h-10 w-2/3 animate-pulse rounded bg-surface-secondary" />
        <div className="h-6 w-32 animate-pulse rounded bg-surface-secondary" />
        <div className="h-12 w-full animate-pulse rounded bg-surface-secondary" />
      </div>
    </div>
  );
}

async function RelatedProducts({ product }: { product: Product }) {
  if (!product.category) return null;

  let related: Product[] = [];
  try {
    const listing = await getProductListing({
      category: product.category.slug,
      limit: 8,
      sort: "newest",
    });
    related = listing.items.filter((item) => item.id !== product.id).slice(0, 4);
  } catch {
    return null;
  }

  if (related.length === 0) return null;

  return (
    <section className="mt-16 border-t border-border pt-10">
      <h2 className="text-h2">More in {product.category.name}</h2>
      <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-6">
        {related.map((item) => (
          <li key={item.id}>
            <ProductCard product={item} returnTo={`/products/${product.slug}`} />
          </li>
        ))}
      </ul>
    </section>
  );
}

async function ProductDetails({ params, searchParams }: ProductPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  let product: Product | null = null;
  let unavailable = false;

  try {
    product = await getProductBySlug(slug);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    unavailable = !message.includes("404");
  }

  if (unavailable) {
    return (
      <div className="rounded-lg border border-border bg-surface px-5 py-8">
        <h1 className="text-h2">We couldn&apos;t load this product</h1>
        <p className="text-body mt-3 text-foreground-muted">
          The catalog API didn&apos;t respond. Try again in a moment.
        </p>
        <Link
          href={`/products/${slug}`}
          className="mt-5 inline-flex rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-foam"
        >
          Retry
        </Link>
      </div>
    );
  }

  if (!product || product.status !== "ACTIVE") {
    notFound();
  }

  const crumbs = [
    { href: "/", label: "Home" },
    ...(product.category?.parent
      ? [
          {
            href: `/categories/${product.category.parent.slug}`,
            label: product.category.parent.name,
          },
        ]
      : []),
    ...(product.category
      ? [
          {
            href: `/categories/${product.category.slug}`,
            label: product.category.name,
          },
        ]
      : []),
    { href: `/products/${product.slug}`, label: product.name },
  ];

  const origin = siteUrl();
  return (
    <>
      <TrackView
        name="product_view"
        onceKey={`product:${product.id}:${query.variant ?? "default"}`}
        properties={{
          productId: product.id,
          slug: product.slug,
          ...(query.variant ? { variantId: query.variant } : {}),
          ...(product.category ? { category: product.category.slug } : {}),
        }}
      />
      {query.variant ? (
        <TrackView
          name="product_variant_selected"
          onceKey={`variant:${product.id}:${query.variant}`}
          properties={{ productId: product.id, slug: product.slug, variantId: query.variant }}
        />
      ) : null}
      <JsonLd data={productStructuredData(product, origin, query.variant)} />
      <JsonLd
        data={breadcrumbStructuredData(
          crumbs.map((crumb) => ({ name: crumb.label, path: crumb.href })),
          origin,
        )}
      />
      <nav aria-label="Breadcrumb" className="text-body-sm text-foreground-muted">
        <ol className="flex flex-wrap items-center gap-2">
          {crumbs.map((crumb, index) => (
            <li key={crumb.href} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden>/</span> : null}
              {index === crumbs.length - 1 ? (
                <span className="text-foreground">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-primary">
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <div className="mt-6">
        <ProductView product={product} variantId={query.variant} />
      </div>
      <Suspense
        fallback={
          <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        }
      >
        <RelatedProducts product={product} />
      </Suspense>
    </>
  );
}

export default function ProductPage(props: ProductPageProps) {
  return (
    <main className="flex-1 pb-28 pt-4 md:pb-20 md:pt-6">
      <Container>
        <Suspense fallback={<ProductSkeleton />}>
          <ProductDetails {...props} />
        </Suspense>
      </Container>
    </main>
  );
}
