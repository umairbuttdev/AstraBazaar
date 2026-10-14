import { addToCartAction } from "@/app/cart/actions";

type AddToCartFormProps = {
  variants: Array<{
    id: string;
    name: string | null;
    sku: string;
    price: string;
    inventory: { quantity: number; reserved: number } | null;
  }>;
  returnTo: string;
  error?: string;
};

function formatPrice(value: string) {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return value;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function AddToCartForm({ variants, returnTo, error }: AddToCartFormProps) {
  const availableVariants = variants.filter((variant) => {
    const available =
      (variant.inventory?.quantity ?? 0) - (variant.inventory?.reserved ?? 0);
    return available > 0;
  });

  if (availableVariants.length === 0) {
    return <p className="mt-8 text-sm text-ink-soft">Sold out</p>;
  }

  return (
    <form action={addToCartAction} className="mt-8 space-y-4">
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="quantity" value="1" />

      <label className="block">
        <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
          Choose variant
        </span>
        <select
          name="variantId"
          required
          defaultValue={availableVariants[0]?.id}
          className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
        >
          {availableVariants.map((variant) => {
            const available =
              (variant.inventory?.quantity ?? 0) -
              (variant.inventory?.reserved ?? 0);

            return (
              <option key={variant.id} value={variant.id}>
                {variant.name ?? variant.sku} — {formatPrice(variant.price)} (
                {available} left)
              </option>
            );
          })}
        </select>
      </label>

      {error ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="bg-ink px-6 py-3 text-sm font-semibold tracking-wide text-foam transition-colors hover:bg-copper"
      >
        Add to cart
      </button>
    </form>
  );
}
