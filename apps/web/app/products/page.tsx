import { Suspense } from "react";
import { TrackView } from "@/components/analytics/track-view";
import { CatalogPage } from "@/components/catalog/catalog-page";
import { CatalogSkeleton } from "@/components/catalog/catalog-experience";
import { Container } from "@/components/ui/container";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Products",
  description: "Browse the AstraBazaar catalog.",
  alternates: { canonical: "/products" },
};

async function ProductsResults({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <>
      <TrackView name="product_list_view" onceKey="products" properties={{ page: "products" }} />
      <CatalogPage pathname="/products" searchParams={params} mode="browse" />
    </>
  );
}

export default function ProductsPage({ searchParams }: PageProps) {
  return (
    <main className="flex-1 pb-16 pt-4 md:pb-20 md:pt-5">
      <Container>
        <Suspense fallback={<CatalogSkeleton />}>
          <ProductsResults searchParams={searchParams} />
        </Suspense>
      </Container>
    </main>
  );
}
