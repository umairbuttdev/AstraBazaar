import 'dotenv/config';
import { PrismaClient, ProductStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const apparel = await prisma.category.upsert({
    where: { slug: 'apparel' },
    update: {},
    create: {
      name: 'Apparel',
      slug: 'apparel',
      description: 'Clothing and everyday wear',
    },
  });

  const sneakers = await prisma.category.upsert({
    where: { slug: 'sneakers' },
    update: {},
    create: {
      name: 'Sneakers',
      slug: 'sneakers',
      description: 'Casual and performance sneakers',
      parentId: apparel.id,
    },
  });

  const astra = await prisma.brand.upsert({
    where: { slug: 'astra' },
    update: {},
    create: {
      name: 'Astra',
      slug: 'astra',
      description: 'House brand for AstraBazaar',
    },
  });

  const product = await prisma.product.upsert({
    where: { slug: 'astra-runner-01' },
    update: {
      status: ProductStatus.ACTIVE,
    },
    create: {
      name: 'Astra Runner 01',
      slug: 'astra-runner-01',
      description: 'Lightweight everyday runner with a clean silhouette.',
      status: ProductStatus.ACTIVE,
      categoryId: sneakers.id,
      brandId: astra.id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
            alt: 'Astra Runner 01',
            isPrimary: true,
            sortOrder: 0,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: 'ASTRA-RUN-01-8',
            name: 'Size 8',
            price: '129.00',
            compareAtPrice: '149.00',
            attributes: { size: '8' },
            isDefault: true,
            inventory: {
              create: {
                quantity: 25,
                reserved: 0,
              },
            },
          },
          {
            sku: 'ASTRA-RUN-01-9',
            name: 'Size 9',
            price: '129.00',
            compareAtPrice: '149.00',
            attributes: { size: '9' },
            inventory: {
              create: {
                quantity: 18,
                reserved: 0,
              },
            },
          },
        ],
      },
    },
  });

  console.log('Seeded catalog sample:', {
    category: sneakers.slug,
    brand: astra.slug,
    product: product.slug,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
