import Link from "next/link";
import { Suspense } from "react";
import { CreateProductForm } from "@/components/admin/create-product-form";
import { adminListBrands, adminListCategories } from "@/lib/admin-api";

async function NewProductForm() {
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
        Fill in the basics, then add each product version under{" "}
        <strong>Variants</strong> with <strong>Add another version</strong>.
      </p>

      <CreateProductForm categories={categories} brands={brands} />
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading form...</p>}>
      <NewProductForm />
    </Suspense>
  );
}
