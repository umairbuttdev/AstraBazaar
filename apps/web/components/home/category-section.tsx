import { CategoryCard } from "@/components/ui/category-card";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import type { CategoryWithMeta } from "@/lib/api";
import {
  buildCategoryTree,
  categoryCountMap,
  countCategoryProducts,
  pruneEmptyCategories,
  type CategoryNode,
} from "@/lib/category-tree";
import type { Product } from "@/lib/types";
import { getPrimaryImage } from "@/lib/api";

type CategorySectionProps = {
  categories: CategoryWithMeta[];
  products: Product[];
};

function imageFor(
  node: CategoryNode,
  images: Map<string, { url: string; alt: string | null }>,
): { url: string; alt: string | null } | undefined {
  const own = images.get(node.slug);
  if (own) return own;
  for (const child of node.children) {
    const image = imageFor(child, images);
    if (image) return image;
  }
  return undefined;
}

export function CategorySection({ categories, products }: CategorySectionProps) {
  const counts = categoryCountMap(categories);
  const roots = pruneEmptyCategories(buildCategoryTree(categories), counts);

  if (roots.length === 0) {
    return null;
  }

  const imageByCategory = new Map<string, { url: string; alt: string | null }>();
  for (const product of products) {
    const slug = product.category?.slug;
    if (!slug || imageByCategory.has(slug)) {
      continue;
    }
    const image = getPrimaryImage(product);
    if (image?.url) {
      imageByCategory.set(slug, { url: image.url, alt: image.alt });
    }
  }

  return (
    <Section
      id="categories"
      eyebrow="Browse"
      title="Shop by category"
      description="Open a department to browse its subcategories."
      headerAction={
        <Button href="/products" variant="ghost" size="sm">
          View all products
        </Button>
      }
    >
      <div className="scrollbar-none -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:pb-0 lg:grid-cols-5">
        {roots.map((category) => {
          const image = imageFor(category, imageByCategory);
          return (
            <CategoryCard
              key={category.id}
              name={category.name}
              slug={category.slug}
              imageUrl={image?.url}
              imageAlt={image?.alt}
              productCount={countCategoryProducts(category, counts)}
            />
          );
        })}
      </div>
    </Section>
  );
}
