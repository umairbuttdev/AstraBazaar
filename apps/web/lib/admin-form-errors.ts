export type AdminChoiceError = {
  versionIndex: number;
  rowIndex: number;
  part: "name" | "value";
};

export type AdminVariantDraft = {
  name?: string;
  sku?: string;
  price: string;
  compareAtPrice?: string;
  quantity: number;
  attributes: Array<{ name: string; value: string }>;
};

export type AdminProductDraft = {
  name: string;
  slug: string;
  description: string;
  status: string;
  categoryId: string;
  brandId: string;
  imageAlt: string;
  variants: AdminVariantDraft[];
};

export type AdminFormState = {
  status: "idle" | "error";
  message?: string;
  fields?: string[];
  choiceErrors?: AdminChoiceError[];
  /** Version indexes whose choice labels don’t match the shared set. */
  mismatchVersions?: number[];
  values?: AdminProductDraft;
  /** Bump to remount text fields with restored defaultValues after an error. */
  restoreKey?: number;
};

export const ADMIN_FORM_IDLE: AdminFormState = { status: "idle" };

const FIELD_CLASS =
  "mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper";

const FIELD_ERROR_CLASS =
  "mt-2 w-full border border-red-500 bg-red-50 px-4 py-3 text-ink outline-none transition focus:border-red-600";

export function adminFieldClass(invalid?: boolean) {
  return invalid ? FIELD_ERROR_CLASS : FIELD_CLASS;
}

/** Map API / validation messages to form field names for red highlights. */
export function inferAdminFormFields(message: string): string[] {
  const text = message.toLowerCase();
  const fields = new Set<string>();

  if (
    text.includes("slug") ||
    text.includes("page link") ||
    (text.includes("already exists") && text.includes("product"))
  ) {
    fields.add("slug");
  }
  if (text.includes("name and slug") || text.includes("name are required")) {
    fields.add("name");
    fields.add("slug");
  }
  if (
    text.includes("sku") ||
    text.includes("stock code") ||
    (text.includes("already exists") && text.includes("variant"))
  ) {
    fields.add("sku");
  }
  if (text.includes("price")) fields.add("price");
  if (text.includes("quantity") || text.includes("stock")) {
    fields.add("quantity");
  }
  if (
    text.includes("customer choice") ||
    text.includes("choice label") ||
    text.includes("same labels") ||
    text.includes("uses these customer choices") ||
    text.includes("fill in a value") ||
    text.includes("add a label") ||
    text.includes("don’t match") ||
    text.includes("don't match") ||
    text.includes("not matching") ||
    text.includes("same set of customer choices")
  ) {
    fields.add("attributes");
  }
  if (text.includes("image")) fields.add("images");
  if (text.includes("at least one variant") || text.includes("at least one version")) {
    fields.add("variants");
  }
  if (text.includes("category")) fields.add("categoryId");
  if (text.includes("brand")) fields.add("brandId");

  if (fields.size === 0) fields.add("form");
  return [...fields];
}

export function snapshotProductDraft(formData: FormData): AdminProductDraft {
  const priceCount = formData.getAll("price").length;
  const variants: AdminVariantDraft[] = [];

  for (let index = 0; index < priceCount; index += 1) {
    const attributeNames = formData
      .getAll(`attributeName-${index}`)
      .map((value) => String(value));
    const attributeValues = formData
      .getAll(`attributeValue-${index}`)
      .map((value) => String(value));
    const attributes = attributeNames.map((name, attributeIndex) => ({
      name,
      value: attributeValues[attributeIndex] ?? "",
    }));

    variants.push({
      name: String(formData.getAll("variantName")[index] ?? ""),
      sku: String(formData.getAll("sku")[index] ?? ""),
      price: String(formData.getAll("price")[index] ?? ""),
      compareAtPrice: String(formData.getAll("compareAtPrice")[index] ?? ""),
      quantity: Number(formData.getAll("quantity")[index] ?? 0),
      attributes,
    });
  }

  return {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    status: String(formData.get("status") ?? "DRAFT"),
    categoryId: String(formData.get("categoryId") ?? ""),
    brandId: String(formData.get("brandId") ?? ""),
    imageAlt: String(formData.get("imageAlt") ?? ""),
    variants,
  };
}

function normalizeChoiceLabel(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function formatChoiceList(labels: string[]) {
  if (labels.length === 0) return "no choices";
  if (labels.length === 1) return labels[0]!;
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

function versionChoiceRows(formData: FormData, index: number) {
  const attributeNames = formData
    .getAll(`attributeName-${index}`)
    .map((value) => String(value));
  const attributeValues = formData
    .getAll(`attributeValue-${index}`)
    .map((value) => String(value));

  return attributeNames.map((rawName, rowIndex) => {
    const name = rawName.trim();
    const value = (attributeValues[rowIndex] ?? "").trim();
    return {
      rowIndex,
      name,
      value,
      key: name ? normalizeChoiceLabel(name) : "",
    };
  });
}

function isFilledVersion(formData: FormData, index: number) {
  const rows = versionChoiceRows(formData, index).filter(
    (row) => row.name && row.value,
  );
  const sku = String(formData.getAll("sku")[index] ?? "").trim();
  const name = String(formData.getAll("variantName")[index] ?? "").trim();
  return rows.length > 0 || Boolean(sku) || Boolean(name);
}

export function findIncompleteChoice(formData: FormData): {
  message: string;
  choiceError: AdminChoiceError;
} | null {
  const priceCount = formData.getAll("price").length;
  for (let index = 0; index < priceCount; index += 1) {
    for (const row of versionChoiceRows(formData, index)) {
      if (row.name && !row.value) {
        return {
          message: `Fill in a value for “${row.name}” on version ${index + 1}, or remove that choice.`,
          choiceError: {
            versionIndex: index,
            rowIndex: row.rowIndex,
            part: "value",
          },
        };
      }
      if (!row.name && row.value) {
        return {
          message: `Add a label for the choice “${row.value}” on version ${index + 1}, or clear that value.`,
          choiceError: {
            versionIndex: index,
            rowIndex: row.rowIndex,
            part: "name",
          },
        };
      }
    }
  }
  return null;
}

/** Every filled version must share the same choice labels (values may differ). */
export function findMismatchedChoices(formData: FormData): {
  message: string;
  mismatchVersions: number[];
  choiceErrors: AdminChoiceError[];
} | null {
  const priceCount = formData.getAll("price").length;
  const filledIndexes = Array.from({ length: priceCount }, (_, index) => index).filter(
    (index) => isFilledVersion(formData, index),
  );
  if (filledIndexes.length < 2) return null;

  const versionLabels = filledIndexes.map((index) => {
    const filled = versionChoiceRows(formData, index).filter(
      (row) => row.name && row.value && row.key,
    );
    const byKey = new Map<string, { name: string; rowIndex: number }>();
    for (const row of filled) {
      if (!byKey.has(row.key)) {
        byKey.set(row.key, { name: row.name, rowIndex: row.rowIndex });
      }
    }
    return { index, byKey };
  });

  const reference =
    versionLabels.find((version) => version.byKey.size > 0) ?? versionLabels[0]!;
  const expectedKeys = [...reference.byKey.keys()].sort();
  const expectedNames = expectedKeys.map(
    (key) => reference.byKey.get(key)?.name ?? key,
  );

  const mismatchVersions: number[] = [];
  const choiceErrors: AdminChoiceError[] = [];
  const details: string[] = [];

  for (const version of versionLabels) {
    const actualKeys = [...version.byKey.keys()].sort();
    if (actualKeys.join("|") === expectedKeys.join("|")) continue;

    mismatchVersions.push(version.index);
    const missing = expectedKeys.filter((key) => !version.byKey.has(key));
    const extra = actualKeys.filter((key) => !expectedKeys.includes(key));

    for (const key of extra) {
      const row = version.byKey.get(key);
      if (row) {
        choiceErrors.push({
          versionIndex: version.index,
          rowIndex: row.rowIndex,
          part: "name",
        });
      }
    }

    const parts: string[] = [];
    if (missing.length > 0) {
      parts.push(
        `missing ${formatChoiceList(
          missing.map((key) => reference.byKey.get(key)?.name ?? key),
        )}`,
      );
    }
    if (extra.length > 0) {
      parts.push(
        `extra ${formatChoiceList(
          extra.map((key) => version.byKey.get(key)?.name ?? key),
        )}`,
      );
    }
    details.push(
      `Version ${version.index + 1} is ${parts.join(" and ")}`,
    );
  }

  if (mismatchVersions.length === 0) return null;

  const expectedLine =
    expectedKeys.length > 0
      ? `Use the same labels on every version: ${formatChoiceList(expectedNames)}.`
      : "Use the same choice labels on every version.";

  return {
    message: `Your customer choices don’t match across all versions. ${expectedLine} ${details.join(" ")}.`,
    mismatchVersions,
    choiceErrors,
  };
}

export function adminFormError(
  error: unknown,
  formData?: FormData,
  fallback = "Admin action failed",
): AdminFormState {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    throw error;
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    throw error;
  }
  const raw = error instanceof Error ? error.message : fallback;
  const message = raw.length > 280 ? `${raw.slice(0, 277)}...` : raw;
  const fields = inferAdminFormFields(message);
  const mismatch = formData ? findMismatchedChoices(formData) : null;
  const text = message.toLowerCase();
  const soundsLikeMismatch =
    text.includes("don’t match") ||
    text.includes("don't match") ||
    text.includes("same labels") ||
    text.includes("uses these customer choices") ||
    text.includes("same set of customer choices");

  return {
    status: "error",
    message,
    fields,
    values: formData ? snapshotProductDraft(formData) : undefined,
    restoreKey: Date.now(),
    choiceErrors: mismatch?.choiceErrors,
    mismatchVersions:
      mismatch?.mismatchVersions ??
      (soundsLikeMismatch && formData ? [0] : undefined),
  };
}
