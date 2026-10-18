import Image from "next/image";

type ProductImageProps = {
  src?: string | null;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
};

function isUsableImageSrc(src: string) {
  if (src.startsWith("/uploads/")) {
    return true;
  }

  try {
    const url = new URL(src);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }
    // Google share links and similar are not direct image assets.
    if (
      url.hostname === "share.google" ||
      url.hostname.endsWith(".google") ||
      url.pathname.includes("/share")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function ProductImage({
  src,
  alt,
  fill = false,
  priority = false,
  sizes,
  className,
}: ProductImageProps) {
  if (!src || !isUsableImageSrc(src)) {
    return (
      <div
        className={`${fill ? "absolute inset-0" : ""} flex items-center justify-center bg-mist text-xs tracking-[0.14em] text-ink-soft uppercase ${className ?? ""}`}
        aria-label={alt}
      >
        No image
      </div>
    );
  }

  const isLocalUpload = src.startsWith("/uploads/");

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      priority={priority}
      sizes={sizes}
      className={className}
      unoptimized={isLocalUpload || !src.includes("images.unsplash.com")}
    />
  );
}
