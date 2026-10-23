import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  createBrandAction,
  createCategoryAction,
  deleteProductAction,
  deleteVariantAction,
  expandPackedOptionsAction,
  updateProductAction,
  updateVariantAction,
} from "@/app/admin/actions";
import { AddVariantForm } from "@/components/admin/add-variant-form";
import { CatalogChoice } from "@/components/admin/catalog-choice";
import { ImagePicker } from "@/components/admin/image-picker";
import { DeleteProductButton } from "@/components/admin/product-actions";
import { AdminVariantGroups } from "@/components/admin/variant-groups";
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/products"
            className="text-sm text-ink-soft underline underline-offset-4"
          >
            Back to products
          </Link>
          <h2 className="mt-4 font-display text-2xl text-ink">{product.name}</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Edit catalog details, versions, and publish status. Inventory is also
            managed under{" "}
            <Link href="/admin/inventory" className="underline underline-offset-4">
              Inventory
            </Link>
            .
          </p>
        </div>
        <DeleteProductButton
          productId={product.id}
          productName={product.name}
          action={deleteProductAction}
          from="detail"
        />
      </div>

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

      <form action={updateProductAction} className="mt-8 space-y-5">
        <input type="hidden" name="id" value={product.id} />
        <h3 className="text-sm font-semibold text-ink">General</h3>

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
            Page link
          </span>
          <input
            name="slug"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            title="Lowercase letters, numbers, and hyphens only"
            defaultValue={product.slug}
            className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
          />
          <span className="mt-1 block text-xs text-ink-soft">
            Short name in the product URL, for example{" "}
            <span className="font-medium text-ink">
              /products/{product.slug || "astra-runner-02"}
            </span>
            . Use lowercase letters, numbers, and hyphens only.
          </span>
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
          <CatalogChoice
            label="Category"
            name="categoryId"
            options={categories}
            nested
            defaultValue={product.category?.id ?? ""}
            createAction={createCategoryAction}
          />
          <CatalogChoice
            label="Brand"
            name="brandId"
            options={brands}
            defaultValue={product.brand?.id ?? ""}
            createAction={createBrandAction}
          />
        </div>

        <div className="space-y-4 border border-ink/10 p-4">
          <p className="text-sm font-semibold text-ink">Product images</p>
          {(() => {
            const images = product.images.filter((image) => !image.variantId);
            if (images.length === 0) {
              return <p className="text-sm text-ink-soft">No product images yet.</p>;
            }
            return (
              <ul className="flex flex-wrap gap-3">
                {images.map((image) => (
                  <li key={image.id} className="relative h-24 w-24 overflow-hidden bg-mist">
                    <ProductImage
                      src={image.url}
                      alt={image.alt ?? product.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </li>
                ))}
              </ul>
            );
          })()}
          <ImagePicker
            name="images"
            label="Add images"
            hint="New photos are added to this listing. The first image stays the main photo. Up to 8 total, 5MB each."
          />
          <label className="block">
            <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
              Description for new images (optional)
            </span>
            <input
              name="imageAlt"
              className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
            />
          </label>
        </div>

        <button
          type="submit"
          className="bg-ink px-6 py-3 text-sm font-semibold tracking-wide text-foam transition-colors hover:bg-copper"
        >
          Save product
        </button>
      </form>

      <div className="mt-8 space-y-4 border border-ink/10 p-4">
        <div>
          <p className="text-sm font-semibold text-ink">Versions</p>
          <p className="mt-1 text-sm text-ink-soft">
            Grouped by look (for example color). Sizes stay as separate stock
            codes under each look so shoppers can pick them one by one.
          </p>
        </div>
        {(() => {
          const packed = product.variants.some((variant) =>
            Object.values(variant.attributes ?? {}).some((value) =>
              /[,\n]/.test(String(value)),
            ),
          );
          if (!packed) return null;
          return (
            <form
              action={expandPackedOptionsAction}
              className="rounded-lg border border-amber-200 bg-amber-50 p-3"
            >
              <input type="hidden" name="productId" value={product.id} />
              <p className="text-sm text-amber-950">
                Some versions list several sizes in one value. Split them so
                shoppers can pick each size on its own.
              </p>
              <button className="mt-2 bg-ink px-4 py-2 text-sm font-semibold text-foam">
                Split into selectable sizes
              </button>
            </form>
          );
        })()}
        <AdminVariantGroups
          product={product}
          updateAction={updateVariantAction}
          deleteAction={deleteVariantAction}
        />
      </div>

      <AddVariantForm
        productId={product.id}
        initialChoices={
          product.variants
            .flatMap((variant) =>
              variant.attributes
                ? Object.keys(variant.attributes).map((name) => ({
                    name,
                    value: "",
                  }))
                : [],
            )
            .filter(
              (choice, choiceIndex, list) =>
                list.findIndex((item) => item.name === choice.name) ===
                choiceIndex,
            )
        }
      />
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
