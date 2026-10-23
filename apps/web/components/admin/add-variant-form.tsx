"use client";

import { useActionState, useEffect, useRef } from "react";
import { addVariantAction } from "@/app/admin/actions";
import { VariantFields } from "@/components/admin/variant-list";
import {
  ADMIN_FORM_IDLE,
  type AdminFormState,
} from "@/lib/admin-form-errors";

export function AddVariantForm({
  productId,
  initialChoices,
}: {
  productId: string;
  initialChoices: Array<{ name: string; value: string }>;
}) {
  const [state, formAction, pending] = useActionState<
    AdminFormState,
    FormData
  >(addVariantAction, ADMIN_FORM_IDLE);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const fields = state.fields ?? [];
  const draft = state.values?.variants?.[0];
  const restoreKey = state.restoreKey ?? 0;

  useEffect(() => {
    if (state.status === "error") {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [state]);

  return (
    <form
      action={formAction}
      className="mt-8 space-y-5 border border-ink/10 p-4"
    >
      <h3 className="font-display text-xl text-ink">Add another version</h3>
      <p className="text-sm text-ink-soft">
        Add the next look (for example another color). Use the same choice
        labels, set sizes with the size buttons, and we create a stock code for
        each size under this look.
      </p>
      {state.status === "error" && state.message ? (
        <p
          ref={errorRef}
          className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {state.message}
          <span className="mt-1 block text-xs text-red-700">
            Your entries are still here — fix the highlighted fields and try
            again.
          </span>
        </p>
      ) : null}
      <input type="hidden" name="productId" value={productId} />
      <VariantFields
        index={0}
        title="New version"
        imageName="variantImages"
        initialChoices={draft?.attributes ?? initialChoices}
        errorFields={fields}
        choiceErrors={state.choiceErrors}
        mismatchVersions={state.mismatchVersions}
        restoreKey={restoreKey}
        defaults={
          draft
            ? {
                name: draft.name,
                sku: draft.sku,
                price: draft.price,
                compareAtPrice: draft.compareAtPrice,
                quantity: draft.quantity,
              }
            : undefined
        }
      />
      <button
        type="submit"
        disabled={pending}
        className="bg-ink px-6 py-3 text-sm font-semibold text-foam hover:bg-copper disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add version"}
      </button>
    </form>
  );
}
