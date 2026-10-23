import { BadRequestException } from '@nestjs/common';

export function catalogSlug(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug || slug.length > 80 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new BadRequestException(
      'Name needs letters or numbers that can become a catalog URL',
    );
  }

  return slug;
}
