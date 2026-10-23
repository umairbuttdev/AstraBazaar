import { BadRequestException } from '@nestjs/common';

export type AdminImageInput = {
  url?: string | null;
  alt?: string | null;
};

export function readAdminImages(images: AdminImageInput[] | undefined, label: string) {
  const rows = (images ?? [])
    .map((image) => ({
      url: image.url?.trim() ?? '',
      alt: image.alt?.trim() || null,
    }))
    .filter((image) => image.url.length > 0);

  if (rows.length > 8) {
    throw new BadRequestException(`${label} can include at most 8 images`);
  }

  for (const image of rows) {
    if (image.url.length > 500) {
      throw new BadRequestException('An image address is too long');
    }
    if (image.alt && image.alt.length > 200) {
      throw new BadRequestException('Image description must be 200 characters or fewer');
    }
  }

  return rows;
}
