function money(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return null;
  }
  return amount.toFixed(2);
}

function availableUnits(inventory: { quantity: number; reserved: number } | null) {
  if (!inventory) {
    return 0;
  }
  return Math.max(0, inventory.quantity - inventory.reserved);
}

type WishlistRecord = {
  id: string;
  profileId: string;
  items: Array<{
    id: string;
    productId: string;
    createdAt: Date;
    product: {
      id: string;
      name: string;
      slug: string;
      status: string;
      images: Array<{
        id: string;
        url: string;
        alt: string | null;
        isPrimary: boolean;
      }>;
      variants: Array<{
        id: string;
        sku: string;
        name: string | null;
        price: unknown;
        compareAtPrice: unknown;
        attributes: unknown;
        isDefault: boolean;
        inventory: { quantity: number; reserved: number } | null;
      }>;
    };
  }>;
};

export function serializeWishlist(wishlist: WishlistRecord) {
  const items = wishlist.items.map((item) => {
    const variants = item.product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      price: money(variant.price),
      compareAtPrice: money(variant.compareAtPrice),
      attributes: variant.attributes,
      isDefault: variant.isDefault,
      available: availableUnits(variant.inventory),
    }));

    return {
      id: item.id,
      productId: item.productId,
      createdAt: item.createdAt,
      purchasable:
        item.product.status === 'ACTIVE' &&
        variants.some((variant) => variant.available > 0),
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        status: item.product.status,
        images: item.product.images,
        variants,
      },
    };
  });

  return {
    id: wishlist.id,
    profileId: wishlist.profileId,
    items,
    itemCount: items.length,
  };
}
