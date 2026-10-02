import type { Prisma } from "@prisma/client";

/**
 * Only the columns a catalog card needs. Skips the long multilingual
 * description JSON and - importantly - originalImageKey, so the private
 * master's key can never end up in a page payload by accident.
 */
export const cardSelect = {
  slug: true,
  title: true,
  previewImageKey: true,
  thumbImageKey: true,
  widthCm: true,
  heightCm: true,
  material: true,
  priceEur: true,
  status: true,
} satisfies Prisma.ProductSelect;
