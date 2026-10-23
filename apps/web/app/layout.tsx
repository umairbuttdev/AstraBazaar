import type { Metadata } from "next";
import { Suspense } from "react";
import { Manrope, Syne } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { StoreHeaderGate } from "@/components/store-header-gate";
import { SiteHeaderFallback } from "@/components/site-header-fallback";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "AstraBazaar",
    template: "%s · AstraBazaar",
  },
  description: "Curated ecommerce for goods with gravity.",
  openGraph: {
    type: "website",
    siteName: "AstraBazaar",
    title: "AstraBazaar",
    description: "Curated ecommerce for goods with gravity.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Suspense fallback={<SiteHeaderFallback />}>
          <StoreHeaderGate>
            <SiteHeader />
          </StoreHeaderGate>
        </Suspense>
        {children}
      </body>
    </html>
  );
}
