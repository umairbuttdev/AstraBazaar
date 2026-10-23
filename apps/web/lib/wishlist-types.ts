export type WishlistImage = {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
};

export type WishlistVariant = {
  id: string;
  sku: string;
  name: string | null;
  price: string | null;
  compareAtPrice: string | null;
  attributes: Record<string, string | number> | null;
  isDefault: boolean;
  available: number;
};

export type WishlistProduct = {
  id: string;
  name: string;
  slug: string;
  status: string;
  images: WishlistImage[];
  variants: WishlistVariant[];
};

export type WishlistItem = {
  id: string;
  productId: string;
  purchasable: boolean;
  product: WishlistProduct;
};

export type Wishlist = {
  id: string;
  profileId: string;
  items: WishlistItem[];
  itemCount: number;
};
