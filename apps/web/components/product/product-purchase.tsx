"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import {
  addProductToCartAction,
  type ProductCartState,
} from "@/app/products/actions";
import { ProductImage } from "@/components/product-image";
import { PriceDisplay } from "@/components/ui/price-display";
import { WishlistButton } from "@/components/wishlist-button";
import { CartAddedDialog } from "@/components/cart-added-dialog";
import { swatchImageForAttribute } from "@/lib/product-gallery";
import {
  COLOR_KEYS,
  SIZE_KEYS,
  attributeEntries,
  pickVariantForAttributes,
  sortOptionValues,
} from "@/lib/product-options";
import { formatMoney, getDiscountPercent } from "@/lib/product-pricing";
import type { Product, ProductVariant } from "@/lib/types";

type ProductPurchaseProps = {
  product: Product;
  variant: ProductVariant;
  saved: boolean;
  returnTo: string;
};

const initialState: ProductCartState = { status: "idle" };

function availableUnits(variant: ProductVariant) {
  return Math.max(
    0,
    (variant.inventory?.quantity ?? 0) - (variant.inventory?.reserved ?? 0),
  );
}

function optionGroups(variants: ProductVariant[]) {
  const keys = new Set<string>();
  for (const variant of variants) {
    for (const [key] of attributeEntries(variant)) keys.add(key);
  }
  const list = [...keys];
  const color = list.filter((key) => COLOR_KEYS.has(key));
  const size = list.filter((key) => SIZE_KEYS.has(key));
  const rest = list.filter((key) => !COLOR_KEYS.has(key) && !SIZE_KEYS.has(key));
  return [...color, ...size, ...rest];
}

function labelFor(key: string) {
  return key.replace(/_/g, " ");
}

export function ProductPurchase({
  product,
  variant,
  saved,
  returnTo,
}: ProductPurchaseProps) {
  const [state, formAction, pending] = useActionState(
    addProductToCartAction,
    initialState,
  );
  const [closedNotice, setClosedNotice] = useState<ProductCartState | null>(null);
  const cartNoticeOpen = state.status === "added" && closedNotice !== state;
  const available = availableUnits(variant);
  const inStock = available > 0;
  const [quantity, setQuantity] = useState(1);
  const maxQuantity = Math.min(available, 99);
  const groups = optionGroups(product.variants);
  const selectedAttributes = Object.fromEntries(
    attributeEntries(variant).map(([key, value]) => [key, String(value)]),
  );
  const shownQuantity = inStock ? Math.min(quantity, Math.max(maxQuantity, 1)) : 0;
  const discountPercent = getDiscountPercent(variant.price, variant.compareAtPrice);
  const sizeKey = groups.find((key) => SIZE_KEYS.has(key));
  const sizeSelected = sizeKey ? Boolean(selectedAttributes[sizeKey]) : true;

  useEffect(() => {
    if (state.status !== "added") return;
    track("cart_item_added", {
      productId: product.id,
      slug: product.slug,
      variantId: variant.id,
      sku: variant.sku,
      quantity: shownQuantity || 1,
    });
  }, [product.id, product.slug, shownQuantity, state, variant.id, variant.sku]);

  const variantDetail = attributeEntries(variant)
    .map(([key, value]) => `${labelFor(key)}: ${value}`)
    .join(" · ");

  const chooseAttribute = (key: string, value: string) =>
    pickVariantForAttributes(
      product.variants,
      groups,
      selectedAttributes,
      key,
      value,
    );

  return (
    <div>
      {product.brand ? (
        <Link
          href={`/products?brand=${product.brand.slug}`}
          className="text-caption tracking-[0.16em] text-primary uppercase hover:text-primary-hover"
        >
          {product.brand.name}
        </Link>
      ) : null}
      <div className="mt-2 flex items-start justify-between gap-4">
        <h1 className="text-h1 text-foreground">{product.name}</h1>
        <WishlistButton
          productId={product.id}
          saved={saved}
          returnTo={returnTo}
        />
      </div>

      <PriceDisplay
        className="mt-4"
        price={variant.price}
        compareAtPrice={variant.compareAtPrice}
        discountPercent={discountPercent}
      />

      <p className="text-body-sm mt-3 font-medium text-foreground">
        {available <= 0
          ? "Out of stock"
          : available <= 5
            ? `Only ${available} left`
            : "In stock"}
      </p>

      <form id="product-purchase" action={formAction} className="mt-6 space-y-6">
        <input type="hidden" name="variantId" value={variant.id} />
        <input type="hidden" name="quantity" value={shownQuantity || 1} />
        <input type="hidden" name="returnTo" value={returnTo} />

        {groups.length > 0 ? (
          groups.map((key, keyIndex) => {
            const priorKeys = groups.slice(0, keyIndex);
            const rawValues = [
              ...new Set(
                product.variants
                  .filter((item) => {
                    const attrs = Object.fromEntries(
                      attributeEntries(item).map(([attrKey, attrValue]) => [
                        attrKey,
                        String(attrValue),
                      ]),
                    );
                    return priorKeys.every(
                      (group) =>
                        attrs[group] === String(selectedAttributes[group] ?? ""),
                    );
                  })
                  .flatMap((item) =>
                    attributeEntries(item)
                      .filter(([attrKey]) => attrKey === key)
                      .map(([, value]) => String(value)),
                  ),
              ),
            ];
            const isColor = COLOR_KEYS.has(key);
            const isSize = SIZE_KEYS.has(key);
            const values = isSize ? sortOptionValues(rawValues) : rawValues;
            const selectedValue = selectedAttributes[key];

            return (
              <fieldset key={key}>
                <legend className="text-sm font-semibold tracking-[0.14em] text-foreground uppercase">
                  {labelFor(key)}
                  {selectedValue ? `: ${selectedValue}` : ""}
                </legend>
                {isColor ? (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {values.map((value) => {
                      const match = chooseAttribute(key, value);
                      const image = swatchImageForAttribute(product, key, value);
                      const selected = selectedValue === value;
                      const href = match
                        ? `/products/${product.slug}?variant=${match.id}`
                        : `/products/${product.slug}`;
                      return (
                        <Link
                          key={value}
                          href={href}
                          scroll={false}
                          aria-label={value}
                          aria-current={selected ? "true" : undefined}
                          title={value}
                          className={`relative h-16 w-16 overflow-hidden rounded-md bg-surface-secondary ${
                            selected
                              ? "ring-2 ring-ink ring-offset-2"
                              : "ring-1 ring-border"
                          }`}
                        >
                          <ProductImage
                            src={image?.url}
                            alt={image?.alt ?? value}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className={`mt-3 grid gap-2 ${
                      isSize
                        ? "grid-cols-4 sm:grid-cols-5"
                        : "grid-cols-2 sm:grid-cols-3"
                    }`}
                  >
                    {values.map((value) => {
                      const match = chooseAttribute(key, value);
                      const candidateAvailable = match
                        ? availableUnits(match) > 0
                        : false;
                      const selected = selectedValue === value;
                      const href = match
                        ? `/products/${product.slug}?variant=${match.id}`
                        : `/products/${product.slug}`;
                      return (
                        <Link
                          key={value}
                          href={href}
                          scroll={false}
                          aria-current={selected ? "true" : undefined}
                          aria-disabled={!match}
                          className={`inline-flex min-h-12 items-center justify-center rounded-md border px-2 text-sm font-semibold ${
                            selected
                              ? "border-ink bg-ink text-foam"
                              : "border-border bg-surface text-foreground hover:border-ink"
                          } ${!match || !candidateAvailable ? "opacity-40" : ""}`}
                        >
                          {value}
                          {!match || !candidateAvailable ? (
                            <span className="sr-only">, unavailable</span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </fieldset>
            );
          })
        ) : product.variants.length > 1 ? (
          <fieldset>
            <legend className="text-sm font-semibold tracking-[0.14em] uppercase">
              Option
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {product.variants.map((item) => {
                const itemAvailable = availableUnits(item) > 0;
                const selected = item.id === variant.id;
                return (
                  <Link
                    key={item.id}
                    href={`/products/${product.slug}?variant=${item.id}`}
                    scroll={false}
                    aria-current={selected ? "true" : undefined}
                    className={`inline-flex min-h-12 items-center justify-center rounded-md border px-3 text-sm font-semibold ${
                      selected
                        ? "border-ink bg-ink text-foam"
                        : "border-border"
                    } ${itemAvailable ? "" : "opacity-40"}`}
                  >
                    {item.name ?? item.sku}
                  </Link>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        <div>
          <p className="text-sm font-semibold tracking-[0.14em] uppercase">
            Quantity
          </p>
          <div className="mt-2 inline-flex items-center rounded-md border border-border">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={!inStock || quantity <= 1}
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              className="h-11 w-11 text-lg disabled:opacity-40"
            >
              −
            </button>
            <span className="min-w-8 text-center text-sm font-semibold" aria-live="polite">
              {shownQuantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={!inStock || quantity >= maxQuantity}
              onClick={() =>
                setQuantity((current) => Math.min(maxQuantity, current + 1))
              }
              className="h-11 w-11 text-lg disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        {state.status === "error" ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-error" role="alert">
            {state.message}
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            name="intent"
            value="cart"
            disabled={!inStock || !sizeSelected || pending}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-ink px-5 text-sm font-semibold tracking-[0.08em] text-foam uppercase disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending
              ? "Adding…"
              : !sizeSelected
                ? "Select a size"
                : inStock
                  ? "Add to cart"
                  : "Out of stock"}
          </button>
          <button
            type="submit"
            name="intent"
            value="buy"
            disabled={!inStock || !sizeSelected || pending}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-border bg-surface px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Buy now
          </button>
        </div>
      </form>

      <p className="text-body-sm mt-5 text-foreground-muted">
        Shipping details are confirmed at checkout.
      </p>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <PriceDisplay
              price={variant.price}
              compareAtPrice={variant.compareAtPrice}
              discountPercent={discountPercent}
            />
          </div>
          <button
            type="submit"
            form="product-purchase"
            name="intent"
            value="cart"
            disabled={!inStock || !sizeSelected || pending}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-foam disabled:opacity-50"
          >
            {!sizeSelected ? "Select size" : inStock ? "Add to cart" : "Out of stock"}
          </button>
        </div>
      </div>
      <CartAddedDialog
        open={cartNoticeOpen}
        productName={product.name}
        detail={variantDetail || variant.name}
        quantity={shownQuantity || 1}
        price={formatMoney(variant.price)}
        onClose={() => setClosedNotice(state)}
      />
    </div>
  );
}
