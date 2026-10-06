-- Exclusive paintings are never repainted or printed (see Product.exclusive in schema.prisma).
ALTER TABLE "products" ADD COLUMN "exclusive" BOOLEAN NOT NULL DEFAULT false;
