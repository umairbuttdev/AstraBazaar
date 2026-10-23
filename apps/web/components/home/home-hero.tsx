"use client";

import Image from "next/image";
import { useState } from "react";
import type { HomeHeroSlide } from "@/lib/home-content";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

type HomeHeroProps = {
  slides: HomeHeroSlide[];
};

export function HomeHero({ slides }: HomeHeroProps) {
  const [index, setIndex] = useState(0);
  const slide = slides[index] ?? slides[0];

  if (!slide) {
    return null;
  }

  const go = (next: number) => {
    setIndex((current) => {
      const total = slides.length;
      return (current + next + total) % total;
    });
  };

  return (
    <section className="relative isolate overflow-hidden bg-ink text-foam">
      <div className="absolute inset-0">
        <Image
          key={slide.id}
          src={slide.imageUrl}
          alt={slide.imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(16,24,32,0.92)_8%,rgba(16,24,32,0.55)_48%,rgba(16,24,32,0.75)_100%)]" />
      </div>

      <Container className="relative flex min-h-[78svh] flex-col justify-end py-16 md:min-h-[86svh] md:py-24">
        <p className="animate-rise text-caption text-foam/80">{slide.label}</p>
        <h1 className="animate-rise-delay text-display mt-4 max-w-3xl whitespace-pre-line text-foam">
          {slide.headline}
        </h1>
        <p className="animate-rise-delay text-body-lg mt-5 max-w-lg text-foam/80">
          {slide.description}
        </p>
        <div className="animate-rise-delay mt-8 flex flex-wrap gap-3">
          <Button href={slide.primaryCta.href} variant="primary" size="lg">
            {slide.primaryCta.label}
          </Button>
          <Button
            href={slide.secondaryCta.href}
            variant="secondary"
            size="lg"
            className="border-foam/30 bg-transparent text-foam hover:border-foam hover:bg-foam/10 hover:text-foam"
          >
            {slide.secondaryCta.label}
          </Button>
        </div>

        {slides.length > 1 ? (
          <div className="mt-10 flex items-center gap-3">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous campaign"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-foam/30 text-foam transition-colors hover:bg-foam/10"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next campaign"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-foam/30 text-foam transition-colors hover:bg-foam/10"
            >
              →
            </button>
            <div className="ml-2 flex gap-2" role="tablist" aria-label="Campaign slides">
              {slides.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Show slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    i === index ? "bg-primary" : "bg-foam/35 hover:bg-foam/60"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
