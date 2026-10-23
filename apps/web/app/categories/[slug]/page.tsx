import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TrackView } from "@/components/analytics/track-view";
import { CatalogPage } from "@/components/catalog/catalog-page";
import { JsonLd } from "@/components/seo/json-ld";
import { CatalogSkeleton } from "@/components/catalog/catalog-experience";
import { Container } from "@/components/ui/container";
import { getCategoryBySlug } from "@/lib/api";
import { siteUrl } from "@/lib/site";
import { breadcrumbStructuredData } from "@/lib/structured-data";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function CategoryResults({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;

  let category: Awaited<ReturnType<typeof getCategoryBySlug>> | null = null;
  let failed = false;

  try {
    category = await getCategoryBySlug(slug);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("404")) {
      failed = true;
    }
  }

  if (failed) {
    return (
      <CatalogPage
        pathname={`/categories/${slug}`}
        searchParams={query}
        mode="category"
      />
    );
  }

  if (!category) {
    notFound();
  }

  return (
    <>
      <TrackView
        name="category_view"
        onceKey={`category:${category.slug}`}
        properties={{ category: category.slug }}
      />
      <JsonLd
        data={breadcrumbStructuredData(
          [
            { name: "Home", path: "/" },
            { name: category.name, path: `/categories/${category.slug}` },
          ],
          siteUrl(),
        )}
      />
      <CatalogPage
        pathname={`/categories/${category.slug}`}
        searchParams={query}
        fixedCategory={category}
        mode="category"
      />
    </>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const category = await getCategoryBySlug(slug);
    const description =
      category.description ?? `Shop ${category.name} at AstraBazaar.`;
    return {
      title: category.name,
      description,
      alternates: { canonical: `/categories/${category.slug}` },
      openGraph: {
        title: category.name,
        description,
        url: `/categories/${category.slug}`,
      },
    };
  } catch {
    return { title: "Category" };
  }
}

export default function CategoryPage({ params, searchParams }: PageProps) {
  return (
    <main className="flex-1 pb-16 pt-4 md:pb-20 md:pt-5">
      <Container>
        <Suspense fallback={<CatalogSkeleton />}>
          <CategoryResults params={params} searchParams={searchParams} />
        </Suspense>
      </Container>
    </main>
  );
}
