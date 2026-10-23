export type CartProductImage = {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
};

export type CartProduct = {
  id: string;
  name: string;
  slug: string;
  status: string;
  images: CartProductImage[];
};

export type CartVariant = {
  id: string;
  sku: string;
  name: string | null;
  price: string;
  compareAtPrice: string | null;
  attributes: Record<string, string | number> | null;
  product: CartProduct;
  inventory: {
    quantity: number;
    reserved: number;
  } | null;
};

export type CartItem = {
  id: string;
  quantity: number;
  variantId: string;
  lineTotal: string;
  available: number;
  purchasable: boolean;
  notice: string | null;
  variant: CartVariant;
};

export type Cart = {
  id: string;
  profileId: string;
  items: CartItem[];
  subtotal: string;
  itemCount: number;
};
