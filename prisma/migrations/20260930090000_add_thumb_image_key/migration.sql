-- Adds the small (≤900px) watermarked thumbnail key used by cards/carousels.
ALTER TABLE "products" ADD COLUMN "thumbImageKey" TEXT;
