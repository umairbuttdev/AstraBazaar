import Image from "next/image";
import Link from "next/link";

type PromoBannerProps = {
  title: string;
  description: string;
  href: string;
  imageUrl: string;
  imageAlt: string;
  className?: string;
};

export function PromoBanner({
  title,
  description,
  href,
  imageUrl,
  imageAlt,
  className = "",
}: PromoBannerProps) {
  return (
    <Link
      href={href}
      className={`group relative block min-h-[16rem] overflow-hidden rounded-lg bg-ink text-foam ${className}`}
    >
      <Image
        src={imageUrl}
        alt={imageAlt}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/35 to-ink/10" />
      <div className="relative flex h-full min-h-[16rem] flex-col justify-end p-6 md:p-8">
        <h3 className="text-h3 text-foam">{title}</h3>
        <p className="text-body-sm mt-2 max-w-xs text-foam/80">{description}</p>
        <span className="mt-4 text-sm font-semibold text-foam underline-offset-4 group-hover:underline">
          Shop now
        </span>
      </div>
    </Link>
  );
}
