import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { updateProductAction } from "@/app/admin/actions";
import { ProductImage } from "@/components/product-image";
import {
  adminGetProduct,
  adminListBrands,
  adminListCategories,
} from "@/lib/admin-api";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
};

async function EditProductForm({ params, searchParams }: EditProductPageProps) {
  const { id } = await params;
  const query = await searchParams;

  let product;
  try {
    product = await adminGetProduct(id);
  } catch {
    notFound();
  }

  const [categories, brands] = await Promise.all([
    adminListCategories(),
    adminListBrands(),
  ]);

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/products"
        className="text-sm text-ink-soft underline underline-offset-4"
      >
        Back to products
      </Link>
      <h2 className="mt-4 font-display text-2xl text-ink">{product.name}</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Update catalog details and publish status. Inventory is managed under{" "}
        <Link href="/admin/inventory" className="underline underline-offset-4">
          Inventory
        </Link>
        .
      </p>

      {query.error ? (
        <p className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {query.error}
        </p>
      ) : null}
      {query.message ? (
        <p className="mt-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {query.message}
        </p>
      ) : null}

      <form
        action={updateProductAction}
        encType="multipart/form-data"
        className="mt-8 space-y-5"
      >
        <input type="hidden" name="id" value={product.id} />

        <label className="block">
          <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
            Name
          </span>
          <input
            name="name"
            required
            defaultValue={product.name}
            className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
          />
        </label>

        <label className="block">
          <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
            Slug
          </span>
          <input
            name="slug"
            required
            defaultValue={product.slug}
            className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
          />
        </label>

        <label className="block">
          <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
            Description
          </span>
          <textarea
            name="description"
            rows={3}
            defaultValue={product.description ?? ""}
            className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
          />
        </label>

        <label className="block">
          <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
            Status
          </span>
          <select
            name="status"
            defaultValue={product.status}
            className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
              Category
            </span>
            <select
              name="categoryId"
              defaultValue={product.category?.id ?? ""}
              className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
            >
              <option value="">None</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
              Brand
            </span>
            <select
              name="brandId"
              defaultValue={product.brand?.id ?? ""}
              className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
            >
              <option value="">None</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-4 border border-ink/10 p-4">
          <p className="text-sm font-semibold text-ink">Product image</p>
          {(() => {
            const image =
              product.images.find((item) => item.isPrimary) ??
              product.images[0];
            return (
              <div className="relative h-40 w-32 overflow-hidden bg-mist">
                <ProductImage
                  src={image?.url}
                  alt={image?.alt ?? product.name}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>
            );
          })()}
          <label className="block">
            <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
              Replace image
            </span>
            <input
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="mt-2 block w-full text-sm text-ink file:mr-4 file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-foam hover:file:bg-copper"
            />
            <span className="mt-1 block text-xs text-ink-soft">
              Leave empty to keep the current image. JPG, PNG, WEBP, or GIF up
              to 5MB.
            </span>
          </label>
          <label className="block">
            <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
              Image alt text (optional)
            </span>
            <input
              name="imageAlt"
              defaultValue={
                product.images.find((item) => item.isPrimary)?.alt ??
                product.images[0]?.alt ??
                ""
              }
              className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
            />
          </label>
        </div>

        <div className="border border-ink/10 p-4">
          <p className="text-sm font-semibold text-ink">Variants</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {product.variants.map((variant) => (
              <li key={variant.id}>
                {variant.name ?? variant.sku} · ${variant.price} · stock{" "}
                {(variant.inventory?.quantity ?? 0) -
                  (variant.inventory?.reserved ?? 0)}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="submit"
          className="bg-ink px-6 py-3 text-sm font-semibold tracking-wide text-foam transition-colors hover:bg-copper"
        >
          Save product
        </button>
      </form>
    </div>
  );
}

export default function EditProductPage(props: EditProductPageProps) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading product...</p>}>
      <EditProductForm {...props} />
    </Suspense>
  );
}
