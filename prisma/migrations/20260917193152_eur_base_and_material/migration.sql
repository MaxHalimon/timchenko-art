/*
  Warnings:

  - The values [IN_PROGRESS] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `priceUsd` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `amountUsd` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `artistPayoutUsd` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `platformCommissionUsd` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `priceUsd` on the `products` table. All the data in the column will be lost.
  - Added the required column `priceEur` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amountEur` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `artistPayoutEur` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platformCommissionEur` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceEur` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
TRUNCATE TABLE "products", "orders" CASCADE;
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PREVIEW', 'PAID', 'PAINTING', 'DRYING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED');
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PREVIEW';
COMMIT;

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "priceUsd",
ADD COLUMN     "priceEur" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "amountUsd",
DROP COLUMN "artistPayoutUsd",
DROP COLUMN "platformCommissionUsd",
ADD COLUMN     "amountEur" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "artistPayoutEur" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'uk',
ADD COLUMN     "platformCommissionEur" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "priceUsd",
ADD COLUMN     "priceEur" DECIMAL(10,2) NOT NULL,
ALTER COLUMN "material" SET DEFAULT 'oilCanvas';
