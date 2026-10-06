-- Order items can now be canvas prints and repeated hand-painted copies, in any
-- quantity, mixed in one order. The old rule "a product can be in at most one
-- order item" (unique productId) is replaced by a unique reservation column that
-- is only filled for the single existing painting (variant ORIGINAL).

CREATE TYPE "OrderItemVariant" AS ENUM ('ORIGINAL', 'REPAINT', 'PRINT');

DROP INDEX "order_items_productId_key";

ALTER TABLE "order_items" ADD COLUMN "variant" "OrderItemVariant" NOT NULL DEFAULT 'ORIGINAL';
ALTER TABLE "order_items" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "order_items" ADD COLUMN "reservedProductId" TEXT;

-- Every existing row is a one-off original that already holds its reservation.
UPDATE "order_items" SET "reservedProductId" = "productId";

CREATE UNIQUE INDEX "order_items_reservedProductId_key" ON "order_items"("reservedProductId");
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");
