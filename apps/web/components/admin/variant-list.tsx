"use client";

import { useEffect, useState } from "react";
import { ImagePicker } from "@/components/admin/image-picker";
import {
  isMultiValueChoiceLabel,
  splitStoredValues,
  ValueTagsInput,
} from "@/components/admin/value-tags-input";
import {
  adminFieldClass,
  type AdminChoiceError,
  type AdminVariantDraft,
} from "@/lib/admin-form-errors";

const CHOICE_SUGGESTIONS = [
  "Color",
  "Size",
  "Shade",
  "Flavor",
  "Scent",
  "Material",
  "Style",
  "Volume",
  "Capacity",
  "Pack",
];

type ChoiceRow = {
  id: number;
  name: string;
  values: string[];
};

function rowsFromChoices(
  initialChoices?: Array<{ name: string; value: string }>,
): ChoiceRow[] {
  if (initialChoices && initialChoices.length > 0) {
    return initialChoices.map((choice, choiceIndex) => ({
      id: choiceIndex + 1,
      name: choice.name,
      values: splitStoredValues(choice.value),
    }));
  }
  return [
    { id: 1, name: "Color", values: [] },
    { id: 2, name: "Size", values: [] },
  ];
}

function ChoiceEditor({
  index,
  initialChoices,
  rowErrors = [],
  restoreKey = 0,
  mismatched = false,
}: {
  index: number;
  initialChoices?: Array<{ name: string; value: string }>;
  rowErrors?: Array<{ rowIndex: number; part: "name" | "value" }>;
  restoreKey?: number;
  mismatched?: boolean;
}) {
  const [rows, setRows] = useState<ChoiceRow[]>(() =>
    rowsFromChoices(initialChoices),
  );
  const [appliedKey, setAppliedKey] = useState(restoreKey);

  if (restoreKey !== appliedKey && initialChoices) {
    setAppliedKey(restoreKey);
    setRows(rowsFromChoices(initialChoices));
  }

  function applySuggestion(label: string) {
    setRows((current) => {
      if (
        current.some(
          (row) => row.name.trim().toLowerCase() === label.toLowerCase(),
        )
      ) {
        return current;
      }
      const empty = current.find((row) => !row.name.trim());
      if (empty) {
        return current.map((row) =>
          row.id === empty.id ? { ...row, name: label } : row,
        );
      }
      return [...current, { id: Date.now(), name: label, values: [] }];
    });
  }

  function setRowName(id: number, name: string) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;
        const nextMulti = isMultiValueChoiceLabel(name);
        const wasMulti = isMultiValueChoiceLabel(row.name);
        return {
          ...row,
          name,
          values:
            !nextMulti && wasMulti && row.values.length > 1
              ? row.values.slice(0, 1)
              : row.values,
        };
      }),
    );
  }

  return (
    <div
      className={`space-y-4 rounded-xl p-1 ${
        mismatched ? "ring-2 ring-red-500 ring-offset-2" : ""
      }`}
    >
      <p className="text-sm tracking-[0.14em] text-ink-soft uppercase">
        Customer choices
      </p>
      <p className="text-xs text-ink-soft">
        Set Color to one look (for example Coffee). For Size, tap the size
        buttons or type a size and click Add — no commas needed.
      </p>
      {mismatched ? (
        <p className="text-sm text-red-800" role="alert">
          This version’s choice labels must match the other versions. Add the
          missing labels or remove extra ones.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {CHOICE_SUGGESTIONS.map((label) => {
          const selected = rows.some(
            (row) => row.name.trim().toLowerCase() === label.toLowerCase(),
          );
          return (
            <button
              key={label}
              type="button"
              onClick={() => applySuggestion(label)}
              className={`border px-2.5 py-1 text-xs font-semibold ${
                selected
                  ? "border-copper text-ink"
                  : "border-ink/15 text-ink hover:border-copper"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      {rows.map((row, rowIndex) => {
        const multi = isMultiValueChoiceLabel(row.name);
        const nameInvalid = rowErrors.some(
          (error) => error.rowIndex === rowIndex && error.part === "name",
        );
        const valueInvalid = rowErrors.some(
          (error) => error.rowIndex === rowIndex && error.part === "value",
        );
        const rowInvalid = nameInvalid || valueInvalid;
        return (
          <div
            key={row.id}
            className={`space-y-3 rounded-xl border bg-foam p-4 ${
              rowInvalid ? "border-red-500" : "border-ink/10"
            }`}
          >
            <div className="flex flex-wrap items-end gap-3">
              <label className="block min-w-[8rem] flex-1">
                <span className="text-xs font-semibold tracking-[0.12em] text-ink-soft uppercase">
                  Label
                </span>
                <input
                  name={`attributeName-${index}`}
                  value={row.name}
                  onChange={(event) => setRowName(row.id, event.target.value)}
                  placeholder="Color"
                  aria-invalid={nameInvalid || undefined}
                  className={adminFieldClass(nameInvalid)}
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  setRows((current) =>
                    current.length === 1
                      ? [{ id: current[0]!.id, name: "", values: [] }]
                      : current.filter((item) => item.id !== row.id),
                  )
                }
                className="pb-3 text-xs font-semibold text-ink underline underline-offset-4"
              >
                Remove
              </button>
            </div>

            {multi ? (
              <div>
                <span className="text-xs font-semibold tracking-[0.12em] text-ink-soft uppercase">
                  Values
                </span>
                <ValueTagsInput
                  name={`attributeValue-${index}`}
                  values={row.values}
                  showSizePresets={/^size$/i.test(row.name.trim())}
                  placeholder="Type a size, then Add"
                  invalid={valueInvalid}
                  onChange={(values) =>
                    setRows((current) =>
                      current.map((item) =>
                        item.id === row.id ? { ...item, values } : item,
                      ),
                    )
                  }
                />
              </div>
            ) : (
              <label className="block">
                <span className="text-xs font-semibold tracking-[0.12em] text-ink-soft uppercase">
                  Value
                </span>
                <input
                  name={`attributeValue-${index}`}
                  value={row.values[0] ?? ""}
                  onChange={(event) =>
                    setRows((current) =>
                      current.map((item) =>
                        item.id === row.id
                          ? {
                              ...item,
                              values: event.target.value
                                ? [event.target.value]
                                : [],
                            }
                          : item,
                      ),
                    )
                  }
                  placeholder="Coffee"
                  aria-invalid={valueInvalid || undefined}
                  className={adminFieldClass(valueInvalid)}
                />
                {valueInvalid ? (
                  <span className="mt-1 block text-xs text-red-800">
                    Enter a value for this choice, or remove it.
                  </span>
                ) : null}
              </label>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={() =>
          setRows((current) => [
            ...current,
            { id: Date.now(), name: "", values: [] },
          ])
        }
        className="text-sm font-semibold text-ink underline underline-offset-4"
      >
        Add another choice
      </button>
    </div>
  );
}

export function VariantFields({
  index,
  onRemove,
  title,
  imageName,
  initialChoices,
  defaults,
  showDefaultToggle,
  errorFields = [],
  choiceErrors = [],
  mismatchVersions = [],
  restoreKey = 0,
}: {
  index: number;
  onRemove?: () => void;
  title?: string;
  imageName?: string;
  initialChoices?: Array<{ name: string; value: string }>;
  defaults?: {
    name?: string | null;
    sku?: string;
    price?: string | number;
    compareAtPrice?: string | number | null;
    quantity?: number;
    isDefault?: boolean;
  };
  showDefaultToggle?: boolean;
  errorFields?: string[];
  choiceErrors?: AdminChoiceError[];
  mismatchVersions?: number[];
  restoreKey?: number;
}) {
  const invalid = (field: string) => errorFields.includes(field);
  const rowErrors = choiceErrors
    .filter((error) => error.versionIndex === index)
    .map(({ rowIndex, part }) => ({ rowIndex, part }));
  const mismatched = mismatchVersions.includes(index);
  const fieldKey = `${restoreKey}-${index}`;

  return (
    <fieldset className="space-y-5 border-t border-ink/10 pt-6">
      <legend className="font-display text-xl text-ink">
        {title ?? (index === 0 ? "First version" : `Version ${index + 1}`)}
      </legend>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
            Display name
          </span>
          <input
            key={`${fieldKey}-name`}
            name="variantName"
            defaultValue={defaults?.name ?? ""}
            className={adminFieldClass(false)}
          />
        </label>
        <label className="block">
          <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
            Stock code
          </span>
          <input
            key={`${fieldKey}-sku`}
            name="sku"
            defaultValue={defaults?.sku ?? ""}
            placeholder="Leave blank to create from the choices"
            className={adminFieldClass(invalid("sku"))}
          />
        </label>
      </div>
      <ChoiceEditor
        index={index}
        initialChoices={initialChoices}
        rowErrors={rowErrors}
        restoreKey={restoreKey}
        mismatched={mismatched}
      />
      <ImagePicker
        name={imageName ?? `variantImages-${index}`}
        label="Photos for this version"
        hint="Optional. JPG, PNG, WEBP, or GIF, up to 8 images and 5MB each."
      />
      <div className="grid gap-5 sm:grid-cols-3">
        <label className="block">
          <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
            Price
          </span>
          <input
            key={`${fieldKey}-price`}
            name="price"
            required
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={
              defaults?.price !== undefined && defaults?.price !== ""
                ? String(defaults.price)
                : ""
            }
            className={adminFieldClass(invalid("price"))}
          />
        </label>
        <label className="block">
          <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
            Compare at
          </span>
          <input
            key={`${fieldKey}-compare`}
            name="compareAtPrice"
            inputMode="decimal"
            defaultValue={
              defaults?.compareAtPrice != null && defaults.compareAtPrice !== ""
                ? String(defaults.compareAtPrice)
                : ""
            }
            className={adminFieldClass(false)}
          />
        </label>
        <label className="block">
          <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">
            Stock quantity
          </span>
          <input
            key={`${fieldKey}-qty`}
            name="quantity"
            type="number"
            min={0}
            defaultValue={
              defaults?.quantity !== undefined ? defaults.quantity : 0
            }
            required
            className={adminFieldClass(invalid("quantity"))}
          />
        </label>
      </div>
      {showDefaultToggle ? (
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="isDefault"
            defaultChecked={Boolean(defaults?.isDefault)}
            className="h-4 w-4 border-ink/30"
          />
          Default version for this product
        </label>
      ) : null}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="text-sm font-semibold text-ink underline underline-offset-4"
        >
          Remove this version
        </button>
      ) : null}
    </fieldset>
  );
}

export function VariantList({
  errorFields = [],
  choiceErrors = [],
  mismatchVersions = [],
  draftVariants,
  restoreKey = 0,
}: {
  errorFields?: string[];
  choiceErrors?: AdminChoiceError[];
  mismatchVersions?: number[];
  draftVariants?: AdminVariantDraft[];
  restoreKey?: number;
}) {
  const [rows, setRows] = useState(() =>
    draftVariants && draftVariants.length > 0
      ? draftVariants.map((_, index) => ({ id: index + 1 }))
      : [{ id: 1 }],
  );

  useEffect(() => {
    if (!restoreKey || !draftVariants?.length) return;
    setRows((current) => {
      if (current.length === draftVariants.length) return current;
      return draftVariants.map((_, index) => current[index] ?? { id: Date.now() + index });
    });
  }, [restoreKey, draftVariants]);

  return (
    <div className="space-y-6 border-t border-ink/10 pt-6">
      <div>
        <h3 className="font-display text-xl text-ink">Variants</h3>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Add one version per look (usually color). For sizes, tap the size
          buttons or Add — each size becomes its own stock code under that look
          so inventory and the shop size grid stay accurate. Use{" "}
          <strong>Add another version</strong> for the next color.
        </p>
      </div>

      {rows.map((row, index) => {
        const draft = draftVariants?.[index];
        return (
          <VariantFields
            key={row.id}
            index={index}
            title={index === 0 ? "First version" : `Version ${index + 1}`}
            imageName={`variantImages-${index}`}
            errorFields={errorFields}
            choiceErrors={choiceErrors}
            mismatchVersions={mismatchVersions}
            restoreKey={restoreKey}
            initialChoices={draft?.attributes}
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
            onRemove={
              rows.length > 1
                ? () =>
                    setRows((current) =>
                      current.filter((item) => item.id !== row.id),
                    )
                : undefined
            }
          />
        );
      })}

      <button
        type="button"
        onClick={() => setRows((current) => [...current, { id: Date.now() }])}
        className="bg-ink px-4 py-2.5 text-sm font-semibold text-foam hover:bg-copper"
      >
        Add another version
      </button>
    </div>
  );
}
