import { formatMoney } from "@/lib/product-pricing";

type PriceDisplayProps = {
  price: string;
  compareAtPrice?: string | null;
  discountPercent?: number | null;
  className?: string;
};

export function PriceDisplay({
  price,
  compareAtPrice,
  discountPercent,
  className = "",
}: PriceDisplayProps) {
  return (
    <div className={`flex flex-wrap items-baseline gap-2 ${className}`}>
      <span className="text-price text-foreground">{formatMoney(price)}</span>
      {compareAtPrice ? (
        <span className="text-body-sm text-foreground-muted line-through">
          {formatMoney(compareAtPrice)}
        </span>
      ) : null}
      {discountPercent ? (
        <span className="text-body-sm font-semibold text-success">
          -{discountPercent}%
        </span>
      ) : null}
    </div>
  );
}
