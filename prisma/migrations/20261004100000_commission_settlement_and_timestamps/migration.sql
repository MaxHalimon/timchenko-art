-- The money flow changed: customers now pay the artist's own Stripe/crypto
-- accounts directly, and the artist pays the site operator the 20% commission
-- afterwards. The old "artistPayoutSent" pair (meaning "we paid the artist her
-- 80%") is therefore renamed — keeping any data — to mean "the 20% commission
-- for this order has been settled", and two timestamps are added so the monthly
-- commission report knows when an order was paid and delivered.

ALTER TABLE "orders" RENAME COLUMN "artistPayoutSent" TO "commissionSettled";
ALTER TABLE "orders" RENAME COLUMN "artistPayoutSentAt" TO "commissionSettledAt";

ALTER TABLE "orders" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "deliveredAt" TIMESTAMP(3);

-- Best-effort backfill for any order that already moved past PREVIEW.
UPDATE "orders" SET "paidAt" = "updatedAt" WHERE "status" <> 'PREVIEW' AND "paidAt" IS NULL;
UPDATE "orders" SET "deliveredAt" = "updatedAt" WHERE "status" = 'DELIVERED' AND "deliveredAt" IS NULL;
