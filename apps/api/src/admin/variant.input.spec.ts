import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { normalizeAdminVariants } from './variant.input.js';

describe('normalizeAdminVariants', () => {
  it('stores multiple customer choices and fills a stock code when blank', () => {
    const variants = normalizeAdminVariants([
      {
        name: 'Red / Medium',
        price: '129.00',
        quantity: 4,
        attributes: [
          { name: 'Color', value: 'Red' },
          { name: 'Size', value: 'M' },
        ],
      },
      {
        price: 139,
        compareAtPrice: '149.00',
        quantity: 2,
        attributes: [
          { name: 'color', value: 'Blue' },
          { name: 'size', value: 'L' },
        ],
      },
    ]);

    expect(variants[0]?.isDefault).toBe(true);
    expect(variants[0]?.sku).toBe('red-m');
    expect(variants[0]?.attributes).toEqual({ color: 'Red', size: 'M' });
    expect(variants[0]?.sourceIndex).toBe(0);
    expect(variants[1]?.sku).toBe('blue-l');
    expect(variants[1]?.compareAtPrice).toBe(149);
    expect(variants[1]?.sourceIndex).toBe(1);
  });

  it('expands comma-separated sizes into one version per size', () => {
    const variants = normalizeAdminVariants([
      {
        price: 199,
        quantity: 5,
        attributes: [
          { name: 'Color', value: 'Coffee' },
          { name: 'Size', value: '10, 6, 8' },
        ],
        images: [{ url: '/uploads/coffee.webp' }],
      },
    ]);

    expect(variants).toHaveLength(3);
    expect(variants.map((item) => item.attributes)).toEqual([
      { color: 'Coffee', size: '10' },
      { color: 'Coffee', size: '6' },
      { color: 'Coffee', size: '8' },
    ]);
    expect(variants.every((item) => item.quantity === 5)).toBe(true);
    expect(variants.every((item) => item.sourceIndex === 0)).toBe(true);
    // Smallest size is the catalog default, even if it was not entered first.
    expect(variants.find((item) => item.isDefault)?.attributes).toEqual({
      color: 'Coffee',
      size: '6',
    });
  });

  it('still accepts a single legacy option pair', () => {
    const [variant] = normalizeAdminVariants([
      {
        sku: 'SHADE-01',
        price: 20,
        quantity: 1,
        attributeName: 'Shade',
        attributeValue: 'Ivory',
      },
    ]);
    expect(variant?.attributes).toEqual({ shade: 'Ivory' });
  });

  it('rejects packed values when allowPacked is false', () => {
    expect(() =>
      normalizeAdminVariants(
        [
          {
            price: 10,
            quantity: 1,
            attributes: [{ name: 'Size', value: '7, 8' }],
          },
        ],
        { allowPacked: false },
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects mismatched choice sets and duplicate stock codes', () => {
    expect(() =>
      normalizeAdminVariants([
        { sku: 'A', price: 1, quantity: 0 },
        { sku: 'a', price: 1, quantity: 0 },
      ]),
    ).toThrow(BadRequestException);

    expect(() =>
      normalizeAdminVariants([
        {
          sku: 'A',
          price: 1,
          quantity: 0,
          attributes: [{ name: 'color', value: 'Red' }],
        },
        {
          sku: 'B',
          price: 1,
          quantity: 0,
          attributes: [
            { name: 'color', value: 'Blue' },
            { name: 'size', value: 'M' },
          ],
        },
      ]),
    ).toThrow(BadRequestException);
  });

  it('ignores empty choice rows and expands two version blocks', () => {
    const variants = normalizeAdminVariants([
      {
        price: 100,
        quantity: 5,
        attributes: [
          { name: 'Color', value: 'Coffee' },
          { name: 'Size', value: '7,8' },
          { name: 'Shade', value: '' },
        ],
      },
      {
        price: 110,
        quantity: 3,
        attributes: [
          { name: 'Color', value: 'Black' },
          { name: 'Size', value: '9' },
          { name: '', value: '' },
        ],
      },
    ]);

    expect(variants).toHaveLength(3);
    expect(variants.map((item) => item.sku)).toEqual([
      'coffee-7',
      'coffee-8',
      'black-9',
    ]);
  });
});
