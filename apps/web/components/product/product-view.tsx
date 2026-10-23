import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
import { galleryImagesForVariant } from "@/lib/product-gallery";
import {
  attributeEntries,
  pickDefaultVariant,
} from "@/lib/product-options";
import { getWishlist } from "@/lib/wishlist-api";
import type { Product } from "@/lib/types";

type ProductViewProps = {
  product: Product;
  variantId?: string;
};

export async function ProductView({ product, variantId }: ProductViewProps) {
  const variant =
    product.variants.find((item) => item.id === variantId) ??
    pickDefaultVariant(product.variants);

  if (!variant) {
    return (
      <p className="text-body text-foreground-muted">
        This product has no purchasable options yet.
      </p>
    );
  }

  const wishlist = await getWishlist();
  const saved = Boolean(
    wishlist?.items.some((item) => item.productId === product.id),
  );
  const images = galleryImagesForVariant(product, variant);
  const specs = attributeEntries(variant);
  const returnTo = `/products/${product.slug}?variant=${variant.id}`;

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery
          key={variant.id}
          images={images}
          productName={product.name}
        />
        <ProductPurchase
          product={product}
          variant={variant}
          saved={saved}
          returnTo={returnTo}
        />
      </div>

      <div className="mt-12 grid gap-10 border-t border-border pt-10 md:mt-16 lg:grid-cols-2">
        <section>
          <h2 className="text-h2">Description</h2>
          {product.description ? (
            <p className="text-body mt-4 whitespace-pre-line text-foreground-muted">
              {product.description}
            </p>
          ) : (
            <p className="text-body mt-4 text-foreground-muted">
              No description has been added for this product.
            </p>
          )}
        </section>
        <section>
          <h2 className="text-h2">Specifications</h2>
          {specs.length > 0 ? (
            <dl className="mt-4 divide-y divide-border border-y border-border">
              {specs.map(([name, value]) => (
                <div key={name} className="grid grid-cols-2 gap-4 py-3 text-sm">
                  <dt className="capitalize text-foreground-muted">{name}</dt>
                  <dd className="font-medium text-foreground">{String(value)}</dd>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4 py-3 text-sm">
                <dt className="text-foreground-muted">SKU</dt>
                <dd className="font-medium text-foreground">{variant.sku}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-body mt-4 text-foreground-muted">
              No specifications are listed for this option.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
