import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { expandPackedVariants } from '../apps/api/dist/admin/expand-packed-variants.js';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? process.env.DIRECT_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const product = await prisma.product.findFirst({
    where: { slug: 'astra-shoes' },
    include: {
      variants: {
        include: {
          inventory: true,
          images: { orderBy: { sortOrder: 'asc' } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!product) throw new Error('astra-shoes not found');
  console.log('current variants', product.variants.length);

  const drafts = expandPackedVariants(
    product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      attributes:
        variant.attributes &&
        typeof variant.attributes === 'object' &&
        !Array.isArray(variant.attributes)
          ? Object.fromEntries(
              Object.entries(variant.attributes).map(([key, value]) => [
                key,
                String(value),
              ]),
            )
          : null,
      quantity: variant.inventory?.quantity ?? 0,
      reserved: variant.inventory?.reserved ?? 0,
      imageUrls: variant.images.map((image) => ({
        url: image.url,
        alt: image.alt,
        sortOrder: image.sortOrder,
      })),
    })),
  );

  if (!drafts) {
    console.log('Nothing to expand');
    return;
  }

  const seen = new Set();
  for (const draft of drafts) {
    let sku = draft.sku;
    let suffix = 2;
    while (seen.has(sku.toLowerCase())) {
      sku = `${draft.sku}-${suffix}`.slice(0, 60);
      suffix += 1;
    }
    seen.add(sku.toLowerCase());
    draft.sku = sku;
  }

  const variantIds = product.variants.map((variant) => variant.id);

  await prisma.$transaction(
    async (tx) => {
      await tx.cartItem.deleteMany({ where: { variantId: { in: variantIds } } });
      await tx.inventory.deleteMany({ where: { variantId: { in: variantIds } } });
      await tx.productImage.deleteMany({
        where: { productId: product.id, variantId: { not: null } },
      });
      await tx.productVariant.deleteMany({ where: { productId: product.id } });

      for (const draft of drafts) {
        const created = await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: draft.sku,
            name: draft.name,
            price: draft.price,
            compareAtPrice: draft.compareAtPrice,
            attributes: draft.attributes,
            isDefault: draft.isDefault,
          },
        });
        await tx.inventory.create({
          data: {
            variantId: created.id,
            quantity: draft.quantity,
            reserved: draft.reserved,
          },
        });
        if (draft.imageUrls.length > 0) {
          await tx.productImage.createMany({
            data: draft.imageUrls.map((image, index) => ({
              productId: product.id,
              variantId: created.id,
              url: image.url,
              alt: image.alt,
              sortOrder: image.sortOrder ?? index,
              isPrimary: false,
            })),
          });
        }
      }
    },
    { timeout: 60000 },
  );

  console.log(`Expanded ${product.slug} into ${drafts.length} versions`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
