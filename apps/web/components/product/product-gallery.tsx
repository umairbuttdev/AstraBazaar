"use client";

import { useEffect, useRef, useState } from "react";
import { ProductImage } from "@/components/product-image";
import { track } from "@/lib/analytics";

type GalleryImage = {
  id: string;
  url: string;
  alt: string | null;
};

type ProductGalleryProps = {
  images: GalleryImage[];
  productName: string;
};

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const imageKey = images.map((image) => image.id).join("|");
  const [trackedKey, setTrackedKey] = useState(imageKey);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const thumbRailRef = useRef<HTMLUListElement>(null);

  if (trackedKey !== imageKey) {
    setTrackedKey(imageKey);
    setIndex(0);
  }

  useEffect(() => {
    const imageId = images[index]?.id;
    if (!imageId || index === 0) return;
    track("product_image_viewed", { page: index });
  }, [images, index]);

  const active = images[index] ?? images[0];
  const alt = active?.alt || productName;
  const list =
    images.length > 0 ? images : [{ id: "empty", url: "", alt: productName }];
  const hasThumbs = list.length > 1;

  function scrollThumbs(direction: "up" | "down") {
    const rail = thumbRailRef.current;
    if (!rail) return;
    rail.scrollBy({ top: direction === "up" ? -120 : 120, behavior: "smooth" });
  }

  return (
    <div>
      <div
        className={`hidden gap-3 lg:grid ${
          hasThumbs
            ? "lg:grid-cols-[4.75rem_minmax(0,1fr)]"
            : "lg:grid-cols-1"
        }`}
      >
        {hasThumbs ? (
          <div className="flex max-h-[36rem] flex-col gap-2">
            {list.length > 5 ? (
              <button
                type="button"
                aria-label="Scroll thumbnails up"
                onClick={() => scrollThumbs("up")}
                className="inline-flex h-8 items-center justify-center rounded-md border border-border text-xs text-foreground-muted hover:border-ink hover:text-foreground"
              >
                ▲
              </button>
            ) : null}
            <ul
              ref={thumbRailRef}
              className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5 scrollbar-none"
            >
              {list.map((image, imageIndex) => {
                const selected = imageIndex === index;
                return (
                  <li key={image.id}>
                    <button
                      type="button"
                      aria-label={`Show image ${imageIndex + 1}`}
                      aria-pressed={selected}
                      onClick={() => setIndex(imageIndex)}
                      className={`relative block aspect-square w-full overflow-hidden rounded-md bg-surface-secondary ${
                        selected ? "ring-2 ring-ink ring-offset-1" : "ring-1 ring-border"
                      }`}
                    >
                      <ProductImage
                        src={image.url}
                        alt={
                          image.alt ||
                          `${productName} thumbnail ${imageIndex + 1}`
                        }
                        fill
                        sizes="76px"
                        className="object-cover"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
            {list.length > 5 ? (
              <button
                type="button"
                aria-label="Scroll thumbnails down"
                onClick={() => scrollThumbs("down")}
                className="inline-flex h-8 items-center justify-center rounded-md border border-border text-xs text-foreground-muted hover:border-ink hover:text-foreground"
              >
                ▼
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-surface-secondary">
          <ProductImage
            src={active?.url}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 50vw, 40vw"
            className="object-cover"
          />
          {active?.url ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="absolute right-3 bottom-3 rounded-md bg-surface/90 px-3 py-2 text-xs font-semibold text-foreground"
            >
              View larger
            </button>
          ) : null}
        </div>
      </div>

      <div className="lg:hidden">
        <div
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-none"
          onScroll={(event) => {
            const width = event.currentTarget.clientWidth;
            if (!width) return;
            const next = Math.round(event.currentTarget.scrollLeft / width);
            setIndex(Math.min(next, Math.max(list.length - 1, 0)));
          }}
        >
          {list.map((image) => (
            <div
              key={image.id}
              className="relative aspect-[4/5] w-full shrink-0 snap-center overflow-hidden rounded-lg bg-surface-secondary"
            >
              <ProductImage
                src={image.url}
                alt={image.alt || productName}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
        {hasThumbs ? (
          <ul className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
            {list.map((image, imageIndex) => {
              const selected = imageIndex === index;
              return (
                <li key={image.id}>
                  <button
                    type="button"
                    aria-label={`Show image ${imageIndex + 1}`}
                    aria-pressed={selected}
                    onClick={() => setIndex(imageIndex)}
                    className={`relative block aspect-square w-full overflow-hidden rounded-md bg-surface-secondary ${
                      selected ? "ring-2 ring-ink" : "ring-1 ring-border"
                    }`}
                  >
                    <ProductImage
                      src={image.url}
                      alt={
                        image.alt ||
                        `${productName} thumbnail ${imageIndex + 1}`
                      }
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {open && active ? (
        <dialog
          open
          aria-label={`${productName} image preview`}
          className="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none items-center justify-center bg-ink/80 p-4"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 rounded-md bg-surface px-3 py-2 text-sm font-semibold"
          >
            Close
          </button>
          <div className="relative h-[80vh] w-full max-w-4xl">
            <ProductImage
              src={active.url}
              alt={alt}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
        </dialog>
      ) : null}
    </div>
  );
}
