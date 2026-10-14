export type ProductImage = {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
};

export type Inventory = {
  quantity: number;
  reserved: number;
};

export type ProductVariant = {
  id: string;
  sku: string;
  name: string | null;
  price: string;
  compareAtPrice: string | null;
  attributes: Record<string, string> | null;
  isDefault: boolean;
  inventory: Inventory | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  category: Category | null;
  brand: Brand | null;
  images: ProductImage[];
  variants: ProductVariant[];
};
