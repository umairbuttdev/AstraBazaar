import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? process.env.DIRECT_URL,
});
const prisma = new PrismaClient({ adapter });

const product = await prisma.product.findFirst({
  where: { slug: 'astra-shoes' },
  include: { variants: { select: { id: true, sku: true } } },
});
const ids = product.variants.map((v) => v.id);
const orderItems = await prisma.orderItem.count({ where: { variantId: { in: ids } } });
const cartItems = await prisma.cartItem.count({ where: { variantId: { in: ids } } });
console.log({ variants: ids.length, orderItems, cartItems });
await prisma.$disconnect();
