import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/account",
        "/cart",
        "/checkout",
        "/orders",
        "/wishlist",
        "/login",
        "/signup",
        "/api",
      ],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
