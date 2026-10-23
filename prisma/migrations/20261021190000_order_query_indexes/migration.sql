-- Dashboard and order lists filter by placement time and payment status.
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");
CREATE INDEX "orders_paymentStatus_idx" ON "orders"("paymentStatus");
