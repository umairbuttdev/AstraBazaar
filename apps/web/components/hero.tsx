import Image from "next/image";
import Link from "next/link";

type HeroProps = {
  imageUrl?: string;
  imageAlt?: string;
};

export function Hero({
  imageUrl = "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
  imageAlt = "Featured product",
}: HeroProps) {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-ink text-foam">
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="animate-hero-media object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(16,24,32,0.88)_12%,rgba(16,24,32,0.42)_48%,rgba(16,24,32,0.7)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(196,120,58,0.22),transparent_42%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col justify-end px-6 pb-20 pt-32 md:px-10 md:pb-24">
        <p className="animate-rise font-display text-5xl leading-none tracking-tight text-foam sm:text-7xl md:text-8xl lg:text-9xl">
          AstraBazaar
        </p>
        <h1 className="animate-rise-delay mt-6 max-w-xl font-display text-2xl leading-tight text-foam sm:text-3xl md:text-4xl">
          Goods with gravity. A bazaar for what lasts.
        </h1>
        <p className="animate-rise-delay mt-4 max-w-md text-base leading-7 text-foam/80 md:text-lg">
          Curated products, clear pricing, and a catalog built to grow with
          AstraBazaar.
        </p>
        <div className="animate-rise-delay mt-8">
          <Link
            href="#catalog"
            className="inline-flex items-center bg-copper px-6 py-3 text-sm font-semibold tracking-wide text-ink transition-colors hover:bg-copper-deep hover:text-foam"
          >
            Shop the catalog
          </Link>
        </div>
      </div>
    </section>
  );
}
