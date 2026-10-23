import { Suspense } from "react";
import { CategorySection } from "@/components/home/category-section";
import { HomeHero } from "@/components/home/home-hero";
import { PromoSection } from "@/components/home/promo-section";
import {
  TrendingProducts,
  TrendingProductsFallback,
} from "@/components/home/trending-products";
import { TrustBenefits } from "@/components/home/trust-benefits";
import { JsonLd } from "@/components/seo/json-ld";
import { getCategories, getProductListing } from "@/lib/api";
import { websiteStructuredData } from "@/lib/structured-data";
import { siteUrl } from "@/lib/site";
import {
  HOME_HERO_SLIDES,
  HOME_PROMOS,
  TRUST_BENEFITS,
} from "@/lib/home-content";

async function HomeCatalogSections() {
  let products: Awaited<ReturnType<typeof getProductListing>>["items"] = [];
  let categories: Awaited<ReturnType<typeof getCategories>> = [];

  try {
    const [listing, categoryList] = await Promise.all([
      getProductListing({ limit: 12, sort: "newest" }),
      getCategories(),
    ]);
    products = listing.items;
    categories = categoryList;
  } catch {
    products = [];
    categories = [];
  }

  return (
    <>
      <CategorySection categories={categories} products={products} />
      <PromoSection promos={HOME_PROMOS} />
      <TrendingProducts products={products} />
    </>
  );
}

export default function Home() {
  return (
    <main className="flex-1">
      <JsonLd data={websiteStructuredData(siteUrl())} />
      <HomeHero slides={HOME_HERO_SLIDES} />
      <TrustBenefits items={TRUST_BENEFITS} />
      <Suspense fallback={<TrendingProductsFallback />}>
        <HomeCatalogSections />
      </Suspense>
    </main>
  );
}
