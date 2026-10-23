"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createBrandAction,
  createCategoryAction,
  createProductAction,
} from "@/app/admin/actions";
import { CatalogChoice } from "@/components/admin/catalog-choice";
import { ImagePicker } from "@/components/admin/image-picker";
import { VariantList } from "@/components/admin/variant-list";
import {
  ADMIN_FORM_IDLE,
  adminFieldClass,
  type AdminFormState,
} from "@/lib/admin-form-errors";

type Option = { id: string; name: string; parentId?: string | null };

export function CreateProductForm({
  categories,
  brands,
}: {
  categories: Option[];
  brands: Option[];
}) {
  const [state, formAction, pending] = useActionState<
    AdminFormState,
    FormData
  >(createProductAction, ADMIN_FORM_IDLE);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const fields = state.fields ?? [];
  const invalid = (name: string) => fields.includes(name);
  const draft = state.values;
  const restoreKey = state.restoreKey ?? 0;

  useEffect(() => {
    if (state.status === "error") {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [state]);

  return (
    <form action={formAction} className="mt-8 space-y-5">
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

      <h3 className="text-sm font-semibold text-ink">General</h3>
      <label className="block">
        <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
          Name
        </span>
        <input
          key={`${restoreKey}-name`}
          name="name"
          required
          defaultValue={draft?.name ?? ""}
          aria-invalid={invalid("name") || undefined}
          className={adminFieldClass(invalid("name"))}
        />
      </label>

      <label className="block">
        <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
          Page link
        </span>
        <input
          key={`${restoreKey}-slug`}
          name="slug"
          required
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          title="Lowercase letters, numbers, and hyphens only"
          placeholder="astra-runner-02"
          defaultValue={draft?.slug ?? ""}
          aria-invalid={invalid("slug") || undefined}
          className={adminFieldClass(invalid("slug"))}
        />
        <span className="mt-1 block text-xs text-ink-soft">
          Short name in the product URL, for example{" "}
          <span className="font-medium text-ink">/products/astra-runner-02</span>
          . Use lowercase letters, numbers, and hyphens only.
        </span>
      </label>

      <label className="block">
        <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
          Description
        </span>
        <textarea
          key={`${restoreKey}-description`}
          name="description"
          rows={3}
          defaultValue={draft?.description ?? ""}
          className={adminFieldClass(false)}
        />
      </label>

      <label className="block">
        <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
          Status
        </span>
        <select
          key={`${restoreKey}-status`}
          name="status"
          defaultValue={draft?.status ?? "DRAFT"}
          className={adminFieldClass(false)}
        >
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <CatalogChoice
          key={`${restoreKey}-category`}
          label="Category"
          name="categoryId"
          options={categories}
          nested
          defaultValue={draft?.categoryId ?? ""}
          invalid={invalid("categoryId")}
          createAction={createCategoryAction}
        />
        <CatalogChoice
          key={`${restoreKey}-brand`}
          label="Brand"
          name="brandId"
          options={brands}
          defaultValue={draft?.brandId ?? ""}
          invalid={invalid("brandId")}
          createAction={createBrandAction}
        />
      </div>

      <div
        className={
          invalid("images")
            ? "rounded-md ring-2 ring-red-500 ring-offset-2"
            : undefined
        }
      >
        <ImagePicker
          name="images"
          label="Product images"
          hint="These photos show for the listing. The first image is the main photo. JPG, PNG, WEBP, or GIF, up to 8 images and 5MB each."
        />
      </div>

      <label className="block">
        <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
          Image description (optional)
        </span>
        <input
          key={`${restoreKey}-imageAlt`}
          name="imageAlt"
          defaultValue={draft?.imageAlt ?? ""}
          className={adminFieldClass(false)}
        />
      </label>

      <VariantList
        errorFields={fields}
        choiceErrors={state.choiceErrors}
        mismatchVersions={state.mismatchVersions}
        draftVariants={draft?.variants}
        restoreKey={restoreKey}
      />

      <button
        type="submit"
        disabled={pending}
        className="bg-ink px-6 py-3 text-sm font-semibold tracking-wide text-foam transition-colors hover:bg-copper disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create product"}
      </button>
    </form>
  );
}
