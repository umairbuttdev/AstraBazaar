import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { catalogSlug } from './catalog-name.js';

describe('catalogSlug', () => {
  it('turns a display name into a catalog slug', () => {
    expect(catalogSlug('Running Shoes')).toBe('running-shoes');
  });

  it('rejects a name that cannot become a slug', () => {
    expect(() => catalogSlug('---')).toThrow(BadRequestException);
  });
});
