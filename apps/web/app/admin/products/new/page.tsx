import Link from "next/link";
import { Suspense } from "react";
import { createProductAction } from "@/app/admin/actions";
import { adminListBrands, adminListCategories } from "@/lib/admin-api";

type NewProductPageProps = {
  searchParams: Promise<{ error?: string }>;
};

async function NewProductForm({ searchParams }: NewProductPageProps) {
  const params = await searchParams;
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
      <h2 className="mt-4 font-display text-2xl text-ink">New product</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Creates the product with one default variant and inventory row.
      </p>

      {params.error ? (
        <p className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {params.error}
        </p>
      ) : null}

      <form
        action={createProductAction}
        encType="multipart/form-data"
        className="mt-8 space-y-5"
      >
        <label className="block">
          <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
            Name
          </span>
          <input
            name="name"
            required
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
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            title="Lowercase letters, numbers, and hyphens only"
            placeholder="astra-runner-02"
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
            className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
          />
        </label>

        <label className="block">
          <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
            Status
          </span>
          <select
            name="status"
            defaultValue="DRAFT"
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

        <label className="block">
          <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
            Product image
          </span>
          <input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="mt-2 block w-full text-sm text-ink file:mr-4 file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-foam hover:file:bg-copper"
          />
          <span className="mt-1 block text-xs text-ink-soft">
            Upload a JPG, PNG, WEBP, or GIF from your computer (max 5MB).
          </span>
        </label>

        <label className="block">
          <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
            Image alt text (optional)
          </span>
          <input
            name="imageAlt"
            className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
          />
        </label>

        <div className="border-t border-ink/10 pt-6">
          <h3 className="font-display text-xl text-ink">Default variant</h3>
          <div className="mt-4 space-y-5">
            <label className="block">
              <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
                SKU
              </span>
              <input
                name="sku"
                required
                className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
              />
            </label>
            <label className="block">
              <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
                Variant name
              </span>
              <input
                name="variantName"
                placeholder="Size 8"
                className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
              />
            </label>
            <div className="grid gap-5 sm:grid-cols-3">
              <label className="block">
                <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
                  Price
                </span>
                <input
                  name="price"
                  required
                  inputMode="decimal"
                  placeholder="129.00"
                  className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
                />
              </label>
              <label className="block">
                <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
                  Compare at
                </span>
                <input
                  name="compareAtPrice"
                  inputMode="decimal"
                  className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
                />
              </label>
              <label className="block">
                <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
                  Quantity
                </span>
                <input
                  name="quantity"
                  type="number"
                  min={0}
                  defaultValue={0}
                  required
                  className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
                />
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="bg-ink px-6 py-3 text-sm font-semibold tracking-wide text-foam transition-colors hover:bg-copper"
        >
          Create product
        </button>
      </form>
    </div>
  );
}

export default function NewProductPage(props: NewProductPageProps) {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading form...</p>}>
      <NewProductForm {...props} />
    </Suspense>
  );
}
