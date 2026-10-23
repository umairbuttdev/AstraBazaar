"use client";

import { useState } from "react";

export function InventoryAdjust({
  variantId,
  quantity,
  reserved,
  stock,
  q,
  page,
  action,
}: {
  variantId: string;
  quantity: number;
  reserved: number;
  stock?: string;
  q?: string;
  page?: number;
  action: (formData: FormData) => void;
}) {
  const [next, setNext] = useState(String(quantity));
  const parsed = Number(next);
  const valid = Number.isInteger(parsed) && parsed >= reserved;
  const available = valid ? parsed - reserved : null;

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="variantId" value={variantId} />
      {stock ? <input type="hidden" name="stock" value={stock} /> : null}
      {q ? <input type="hidden" name="q" value={q} /> : null}
      {page && page > 1 ? <input type="hidden" name="page" value={page} /> : null}
      <label className="text-xs text-ink-soft">
        On hand
        <input
          type="number"
          name="quantity"
          min={reserved}
          value={next}
          onChange={(event) => setNext(event.target.value)}
          className="mt-1 block w-24 border border-ink/15 bg-foam px-2 py-1.5 text-sm text-ink"
        />
      </label>
      <button
        type="submit"
        disabled={!valid}
        className="bg-ink px-3 py-2 text-sm font-semibold text-foam hover:bg-copper disabled:opacity-50"
      >
        Set stock
      </button>
      <p className="text-xs text-ink-soft">
        Reserved {reserved}. Result available {available ?? "—"}.
      </p>
    </form>
  );
}
