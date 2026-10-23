-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'ONLINE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'FAILED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "shippingAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "shippingMethod" TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE "orders" ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'COD';
ALTER TABLE "orders" ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';
