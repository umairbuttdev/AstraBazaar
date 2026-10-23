import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { parseListProductsQuery } from './list-products.query.js';

describe('parseListProductsQuery', () => {
  it('applies discovery defaults', () => {
    expect(parseListProductsQuery({})).toMatchObject({
      brands: [],
      inStock: false,
      deals: false,
      sort: 'newest',
      page: 1,
      limit: 12,
      status: 'ACTIVE',
    });
  });

  it('defaults search to relevance and accepts combined filters', () => {
    expect(
      parseListProductsQuery({
        q: ' runner ',
        category: 'sneakers',
        brand: ['astra', 'nike'],
        minPrice: '10',
        maxPrice: '200.50',
        inStock: '1',
        deals: 'true',
        sort: 'price_asc',
        page: '2',
        limit: '24',
      }),
    ).toMatchObject({
      q: 'runner',
      category: 'sneakers',
      brands: ['astra', 'nike'],
      minPrice: 10,
      maxPrice: 200.5,
      inStock: true,
      deals: true,
      sort: 'price_asc',
      page: 2,
      limit: 24,
    });
  });

  it('rejects an inverted price range', () => {
    expect(() =>
      parseListProductsQuery({ minPrice: '50', maxPrice: '10' }),
    ).toThrow(BadRequestException);
  });

  it('rejects unknown sort values', () => {
    expect(() => parseListProductsQuery({ sort: 'popularity' })).toThrow(
      BadRequestException,
    );
  });
});
