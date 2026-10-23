import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { readAdminImages } from './product-images.js';

describe('readAdminImages', () => {
  it('keeps image addresses and drops blanks', () => {
    expect(
      readAdminImages(
        [{ url: ' /uploads/products/a.jpg ', alt: ' Front ' }, { url: '  ' }],
        'A product',
      ),
    ).toEqual([{ url: '/uploads/products/a.jpg', alt: 'Front' }]);
  });

  it('rejects more than eight images', () => {
    const images = Array.from({ length: 9 }, (_, index) => ({ url: `/uploads/${index}.jpg` }));
    expect(() => readAdminImages(images, 'A variant')).toThrow(BadRequestException);
  });
});
