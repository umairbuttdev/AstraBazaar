-- Allow deleting catalog variants while keeping past order line snapshots.
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_variantId_fkey";

ALTER TABLE "order_items" ALTER COLUMN "variantId" DROP NOT NULL;

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
