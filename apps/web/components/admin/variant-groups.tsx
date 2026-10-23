"use client";

import { useState } from "react";
import { DeleteVariantButton } from "@/components/admin/product-actions";
import { VariantFields } from "@/components/admin/variant-list";
import { ProductImage } from "@/components/product-image";
import {
  availableUnits,
  groupAdminVariants,
  sizeLabelFor,
  type AdminVariantGroup,
} from "@/lib/admin-variant-groups";
import { sizeValueFor } from "@/lib/product-options";
import type { Product, ProductVariant } from "@/lib/types";

type DeleteAction = (formData: FormData) => void | Promise<void>;
type UpdateAction = (formData: FormData) => void | Promise<void>;

function GroupThumbnails({
  group,
  productName,
}: {
  group: AdminVariantGroup;
  productName: string;
}) {
  const images = group.variants.flatMap((variant) => variant.images ?? []);
  const unique = [
    ...new Map(images.map((image) => [image.url, image])).values(),
  ].slice(0, 4);
  if (unique.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {unique.map((image) => (
        <li
          key={image.id}
          className="relative h-14 w-14 overflow-hidden bg-mist"
        >
          <ProductImage
            src={image.url}
            alt={image.alt ?? productName}
            fill
            sizes="56px"
            className="object-cover"
          />
        </li>
      ))}
    </ul>
  );
}

function SizeRow({
  productId,
  variant,
  updateAction,
  deleteAction,
}: {
  productId: string;
  variant: ProductVariant;
  updateAction: UpdateAction;
  deleteAction: DeleteAction;
}) {
  const [open, setOpen] = useState(false);
  const stock = availableUnits(variant);
  const size = sizeLabelFor(variant);

  return (
    <li className="border border-ink/10 bg-foam">
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">
            {sizeValueFor(variant) ? `Size ${size}` : variant.name ?? variant.sku}
            {variant.isDefault ? (
              <span className="ml-2 text-xs font-semibold text-ink-soft">
                default
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {variant.sku} · ${variant.price} · stock {stock}
            {(variant.images?.length ?? 0) > 0
              ? ` · ${variant.images?.length} ${(variant.images?.length ?? 0) === 1 ? "image" : "images"}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="text-sm font-semibold text-ink underline underline-offset-4"
          >
            {open ? "Close" : "Edit size"}
          </button>
          <DeleteVariantButton
            productId={productId}
            variantId={variant.id}
            label={variant.sku}
            action={deleteAction}
          />
        </div>
      </div>
      {open ? (
        <form action={updateAction} className="border-t border-ink/10 px-3 pb-4">
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="variantId" value={variant.id} />
          <VariantFields
            index={0}
            title="Edit size"
            imageName="variantImages"
            showDefaultToggle
            defaults={{
              name: variant.name,
              sku: variant.sku,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice,
              quantity: variant.inventory?.quantity ?? 0,
              isDefault: variant.isDefault,
            }}
            initialChoices={
              variant.attributes
                ? Object.entries(variant.attributes).map(([name, value]) => ({
                    name,
                    value: String(value),
                  }))
                : []
            }
          />
          <button
            type="submit"
            className="mt-4 bg-ink px-5 py-2.5 text-sm font-semibold text-foam hover:bg-copper"
          >
            Save size
          </button>
        </form>
      ) : null}
    </li>
  );
}

function VersionGroupCard({
  productId,
  productName,
  group,
  updateAction,
  deleteAction,
}: {
  productId: string;
  productName: string;
  group: AdminVariantGroup;
  updateAction: UpdateAction;
  deleteAction: DeleteAction;
}) {
  const sizeCount = group.variants.length;
  const sizes = group.variants
    .map((variant) => sizeValueFor(variant))
    .filter((value): value is string => Boolean(value));

  return (
    <li className="border border-ink/10 p-4">
      <div>
        <p className="text-sm font-semibold text-ink">
          {group.label}
          {group.isDefault ? " · default look" : ""}
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          {sizeCount} {sizeCount === 1 ? "size" : "sizes"}
          {sizes.length > 0 ? ` (${sizes.join(", ")})` : ""}
          {" · "}
          {group.priceLabel}
          {" · "}
          stock {group.totalStock}
          {group.imageCount > 0
            ? ` · ${group.imageCount} ${group.imageCount === 1 ? "image" : "images"}`
            : ""}
        </p>
        <p className="mt-2 text-xs text-ink-soft">
          Each size is its own sellable stock code. Edit a size to change price,
          stock, or photos.
        </p>
        <GroupThumbnails group={group} productName={productName} />
      </div>
      <ul className="mt-4 space-y-2">
        {group.variants.map((variant) => (
          <SizeRow
            key={variant.id}
            productId={productId}
            variant={variant}
            updateAction={updateAction}
            deleteAction={deleteAction}
          />
        ))}
      </ul>
    </li>
  );
}

export function AdminVariantGroups({
  product,
  updateAction,
  deleteAction,
}: {
  product: Product;
  updateAction: UpdateAction;
  deleteAction: DeleteAction;
}) {
  const groups = groupAdminVariants(product.variants);

  if (groups.length === 0) {
    return <p className="text-sm text-ink-soft">No versions yet.</p>;
  }

  return (
    <ul className="space-y-6">
      {groups.map((group) => (
        <VersionGroupCard
          key={group.key}
          productId={product.id}
          productName={product.name}
          group={group}
          updateAction={updateAction}
          deleteAction={deleteAction}
        />
      ))}
    </ul>
  );
}
