import { Suspense } from "react";
import { TrackView } from "@/components/analytics/track-view";
import { CatalogPage } from "@/components/catalog/catalog-page";
import { CatalogSkeleton } from "@/components/catalog/catalog-experience";
import { Container } from "@/components/ui/container";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

async function SearchResults({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  return (
    <>
      {query ? (
        <TrackView name="search" onceKey={`search:${query}`} properties={{ query }} />
      ) : null}
      <CatalogPage pathname="/search" searchParams={params} mode="search" />
    </>
  );
}

export default function SearchPage({ searchParams }: PageProps) {
  return (
    <main className="flex-1 pb-16 pt-4 md:pb-20 md:pt-5">
      <Container>
        <Suspense fallback={<CatalogSkeleton />}>
          <SearchResults searchParams={searchParams} />
        </Suspense>
      </Container>
    </main>
  );
}
