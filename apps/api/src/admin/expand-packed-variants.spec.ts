import { describe, expect, it } from 'vitest';
import { expandPackedVariants } from './expand-packed-variants.js';

describe('expandPackedVariants', () => {
  it('splits comma-separated sizes into one version per size and color', () => {
    const drafts = expandPackedVariants([
      {
        id: '1',
        sku: 'Coffee 1',
        name: 'Oxford',
        price: 199,
        compareAtPrice: null,
        attributes: { color: 'Coffee', size: '7,8,9' },
        quantity: 9,
        reserved: 0,
        imageUrls: [{ url: '/a.jpg', alt: null, sortOrder: 0 }],
      },
      {
        id: '2',
        sku: 'Black 1',
        name: 'Oxford',
        price: 199,
        compareAtPrice: null,
        attributes: { color: 'Black', size: '7,8' },
        quantity: 4,
        reserved: 0,
        imageUrls: [],
      },
    ]);

    expect(drafts).not.toBeNull();
    expect(drafts).toHaveLength(5);
    expect(drafts?.[0]?.attributes).toEqual({ color: 'Coffee', size: '7' });
    expect(drafts?.[0]?.quantity).toBe(3);
    expect(drafts?.[3]?.attributes).toEqual({ color: 'Black', size: '7' });
  });

  it('returns null when every value is already a single choice', () => {
    expect(
      expandPackedVariants([
        {
          id: '1',
          sku: 'A',
          name: null,
          price: 10,
          compareAtPrice: null,
          attributes: { color: 'Red', size: 'M' },
          quantity: 1,
          reserved: 0,
          imageUrls: [],
        },
      ]),
    ).toBeNull();
  });
});
