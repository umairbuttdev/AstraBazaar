import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AdminImageInput } from './product-images.js';

export type AdminAttributeInput = {
  name?: string | null;
  value?: string | null;
};

export type AdminVariantInput = {
  sku?: string;
  name?: string | null;
  price?: string | number;
  compareAtPrice?: string | number | null;
  quantity?: number;
  /** @deprecated Prefer attributes[] */
  attributeName?: string | null;
  /** @deprecated Prefer attributes[] */
  attributeValue?: string | null;
  attributes?: AdminAttributeInput[];
  images?: AdminImageInput[];
};

export type NormalizedAdminVariant = {
  sku: string;
  name: string | null;
  price: number;
  compareAtPrice: number | null;
  quantity: number;
  attributes: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  isDefault: boolean;
  /** Index of the admin form version this expanded from (for shared photos). */
  sourceIndex: number;
};

const ATTRIBUTE_NAME = /^[a-z][a-z0-9_]{0,30}$/;

function normalizeAttributeName(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function parsePackedValue(value: string) {
  return [
    ...new Set(
      value
        .split(/[\n,]+/)
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ];
}

function slugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type AttributeAxis = { name: string; values: string[] };

function readAttributeAxes(input: AdminVariantInput): AttributeAxis[] {
  const rows =
    input.attributes && input.attributes.length > 0
      ? input.attributes
      : input.attributeName || input.attributeValue
        ? [{ name: input.attributeName, value: input.attributeValue }]
        : [];

  const axes: AttributeAxis[] = [];
  const seenNames = new Set<string>();

  for (const row of rows) {
    const name = normalizeAttributeName(row.name ?? '');
    const rawValue = row.value?.trim() ?? '';
    // Empty default rows (e.g. unused Color/Size on a second version) are ignored.
    if (!name || !rawValue) continue;
    if (!ATTRIBUTE_NAME.test(name)) {
      throw new BadRequestException(
        `"${row.name}" is not a usable choice label. Use letters, numbers, or spaces (for example Color, Size, Shade)`,
      );
    }
    if (seenNames.has(name)) {
      throw new BadRequestException(`Choice "${name}" is listed twice on one variant`);
    }
    if (rawValue.length > 120) {
      throw new BadRequestException(
        `Choice values for "${row.name}" are too long. Keep the list under 120 characters.`,
      );
    }

    const values = parsePackedValue(rawValue);
    if (values.length === 0) {
      throw new BadRequestException(`Add at least one value for "${row.name}"`);
    }
    for (const value of values) {
      if (value.length > 40) {
        throw new BadRequestException(
          `Each choice value must be 40 characters or fewer (check "${value.slice(0, 20)}…")`,
        );
      }
    }

    seenNames.add(name);
    axes.push({ name, values });
  }

  return axes;
}

function expandAxes(axes: AttributeAxis[]) {
  if (axes.length === 0) {
    return [{} as Record<string, string>];
  }

  return axes
    .reduce<Array<Array<{ name: string; value: string }>>>(
      (rows, axis) => {
        if (rows.length === 0) {
          return axis.values.map((value) => [{ name: axis.name, value }]);
        }
        return rows.flatMap((row) =>
          axis.values.map((value) => [...row, { name: axis.name, value }]),
        );
      },
      [],
    )
    .map((combo) =>
      Object.fromEntries(combo.map((item) => [item.name, item.value])),
    );
}

function attributeKey(attributes: Record<string, string>) {
  return Object.keys(attributes).sort().join('|');
}

function buildSku(
  inputSku: string,
  attributes: Record<string, string>,
  index: number,
) {
  if (inputSku) return inputSku.slice(0, 60);
  const fromChoices = Object.values(attributes)
    .map((value) => slugPart(value))
    .filter(Boolean)
    .join('-');
  if (fromChoices) return fromChoices.slice(0, 60);
  return `variant-${index + 1}`;
}

function comboLabel(attributes: Record<string, string>) {
  const values = Object.values(attributes);
  return values.length > 0 ? values.join(' / ') : null;
}

/**
 * Normalize admin variant drafts. Comma-separated values (especially sizes)
 * expand into one sellable version per combination, e.g. Color=Coffee + Size=7,8,9
 * becomes three versions that share price, stock, and photos.
 */
export function normalizeAdminVariants(
  inputs: AdminVariantInput[],
  options?: { defaultFirst?: boolean; allowPacked?: boolean },
) {
  const defaultFirst = options?.defaultFirst !== false;
  const allowPacked = options?.allowPacked !== false;

  if (inputs.length === 0) {
    throw new BadRequestException('At least one variant is required');
  }

  const seen = new Set<string>();
  const variants: Array<NormalizedAdminVariant & { attributeKey: string }> = [];
  let globalIndex = 0;

  for (const [sourceIndex, input] of inputs.entries()) {
    const axes = readAttributeAxes(input);
    if (!allowPacked && axes.some((axis) => axis.values.length > 1)) {
      throw new BadRequestException(
        'Use one value per choice when editing a single version. Add another version for more sizes.',
      );
    }

    const combos = expandAxes(axes);
    if (variants.length + combos.length > 30) {
      throw new BadRequestException(
        `Expanding sizes would create more than 30 versions. A product can have at most 30.`,
      );
    }

    const price = Number(input.price);
    const quantity = input.quantity ?? 0;
    const compareRaw = input.compareAtPrice;
    const compareAt =
      compareRaw === undefined || compareRaw === null || compareRaw === ''
        ? null
        : Number(compareRaw);
    const baseSku = input.sku?.trim() ?? '';
    const baseName = input.name?.trim() || null;

    if (!Number.isFinite(price) || price < 0) {
      throw new BadRequestException('Price must be a non-negative number');
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new BadRequestException('Quantity must be a non-negative integer');
    }
    if (compareAt !== null && (!Number.isFinite(compareAt) || compareAt < 0)) {
      throw new BadRequestException('Compare-at price is invalid');
    }

    for (const attributes of combos) {
      const attributeKeys = Object.keys(attributes);
      const sku =
        combos.length === 1
          ? buildSku(baseSku, attributes, globalIndex)
          : buildSku(
              baseSku
                ? `${baseSku}-${Object.values(attributes).map(slugPart).filter(Boolean).join('-')}`.slice(
                    0,
                    60,
                  )
                : '',
              attributes,
              globalIndex,
            );

      if (seen.has(sku.toLowerCase())) {
        throw new BadRequestException(`Duplicate stock code ${sku}`);
      }
      seen.add(sku.toLowerCase());

      variants.push({
        sku,
        name:
          combos.length > 1
            ? comboLabel(attributes) ?? baseName
            : baseName ?? comboLabel(attributes),
        price,
        compareAtPrice: compareAt,
        quantity,
        attributes:
          attributeKeys.length > 0
            ? (attributes as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        attributeKey: attributeKey(attributes),
        isDefault: false,
        sourceIndex,
      });
      globalIndex += 1;
    }
  }

  if (variants.length === 0) {
    throw new BadRequestException('At least one variant is required');
  }
  if (variants.length > 30) {
    throw new BadRequestException('A product can have at most 30 variants');
  }

  const keys = variants.map((variant) => variant.attributeKey);
  if (keys.some((key) => key !== keys[0])) {
    throw new BadRequestException(
      'Your customer choices don’t match across all versions. Use the same choice labels on every version (for example Color, Size, and Material on all of them).',
    );
  }

  if (defaultFirst) {
    const sizeAxes = new Set(['size', 'eu', 'uk', 'us', 'length', 'fit']);
    const firstLook = variants.filter((variant) => variant.sourceIndex === 0);
    const pool = firstLook.length > 0 ? firstLook : variants;
    const sizeValue = (variant: (typeof variants)[number]) => {
      const attrs =
        variant.attributes &&
        typeof variant.attributes === 'object' &&
        !Array.isArray(variant.attributes)
          ? (variant.attributes as Record<string, string>)
          : {};
      for (const [key, value] of Object.entries(attrs)) {
        if (sizeAxes.has(key)) return String(value);
      }
      return Object.values(attrs).join(' ');
    };
    const ranked = [...pool].sort((left, right) =>
      sizeValue(left).localeCompare(sizeValue(right), undefined, {
        numeric: true,
        sensitivity: 'base',
      }),
    );
    const pick = ranked[0];
    if (pick) pick.isDefault = true;
  }

  return variants.map(({ attributeKey: _attributeKey, ...variant }) => variant);
}
