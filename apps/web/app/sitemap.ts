import type { MetadataRoute } from "next";
import { getAllProductSlugs, getCategories } from "@/lib/api";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteUrl();
  const entries: MetadataRoute.Sitemap = [
    { url: origin, changeFrequency: "daily", priority: 1 },
    { url: `${origin}/products`, changeFrequency: "daily", priority: 0.8 },
  ];

  try {
    const [categories, slugs] = await Promise.all([
      getCategories(),
      getAllProductSlugs(),
    ]);
    for (const category of categories) {
      entries.push({
        url: `${origin}/categories/${category.slug}`,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
    for (const slug of slugs) {
      entries.push({
        url: `${origin}/products/${slug}`,
        changeFrequency: "daily",
        priority: 0.6,
      });
    }
  } catch {
    return entries;
  }

  return entries;
}
