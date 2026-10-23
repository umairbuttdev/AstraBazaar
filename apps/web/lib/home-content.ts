/**
 * Temporary homepage campaign configuration.
 * Replace with CMS/admin-managed content when available.
 * CTAs and category/brand slugs must map to existing routes/data.
 * Images under /public/images/home are local placeholders — swap for real campaign assets.
 */

export type HomeHeroSlide = {
  id: string;
  label: string;
  headline: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  imageUrl: string;
  imageAlt: string;
};

export type HomePromo = {
  id: string;
  title: string;
  description: string;
  href: string;
  imageUrl: string;
  imageAlt: string;
};

export type TrustBenefit = {
  id: string;
  title: string;
  description: string;
};

export const HOME_HERO_SLIDES: HomeHeroSlide[] = [
  {
    id: "season-01",
    label: "New season collection",
    headline: "Everyday style,\nmade for you",
    description:
      "Discover curated fashion, lifestyle, and house-brand essentials — clear pricing, live stock, and a catalog built to grow.",
    primaryCta: { label: "Shop new arrivals", href: "/products?sort=newest" },
    secondaryCta: {
      label: "Explore sneakers",
      href: "/categories/sneakers",
    },
    imageUrl: "/images/home/hero-1.svg",
    imageAlt: "Seasonal campaign visual for AstraBazaar",
  },
  {
    id: "runners-01",
    label: "Featured edit",
    headline: "Move light.\nStay sharp.",
    description:
      "From the Astra Runner to seasonal essentials — shop pieces with gravity and finish.",
    primaryCta: { label: "Shop runners", href: "/categories/sneakers" },
    secondaryCta: { label: "View catalog", href: "/products" },
    imageUrl: "/images/home/hero-2.svg",
    imageAlt: "Featured product edit campaign visual",
  },
];

export const HOME_PROMOS: HomePromo[] = [
  {
    id: "promo-sneakers",
    title: "The Sneaker Edit",
    description: "Everyday runners and clean silhouettes.",
    href: "/categories/sneakers",
    imageUrl: "/images/home/promo-a.svg",
    imageAlt: "Sneaker collection promotional visual",
  },
  {
    id: "promo-apparel",
    title: "Apparel Essentials",
    description: "Clothing and wear built for daily rotation.",
    href: "/categories/apparel",
    imageUrl: "/images/home/promo-b.svg",
    imageAlt: "Apparel collection promotional visual",
  },
  {
    id: "promo-astra",
    title: "Astra House Brand",
    description: "Products designed under the Astra label.",
    href: "/products?brand=astra",
    imageUrl: "/images/home/promo-c.svg",
    imageAlt: "Astra brand promotional visual",
  },
];

/** Claims aligned with current product capabilities (no COD/free-shipping promises). */
export const TRUST_BENEFITS: TrustBenefit[] = [
  {
    id: "secure",
    title: "Secure account",
    description: "Signed-in checkout with protected sessions.",
  },
  {
    id: "tracking",
    title: "Order tracking",
    description: "Follow fulfillment from placed to delivered.",
  },
  {
    id: "curated",
    title: "Curated catalog",
    description: "Live pricing, variants, and stock from the API.",
  },
  {
    id: "support",
    title: "Customer support",
    description: "Reach us from your order card anytime.",
  },
];

export const ANNOUNCEMENT_ITEMS = [
  "Secure checkout",
  "Live stock & pricing",
  "Order tracking",
  "Curated catalog",
] as const;
