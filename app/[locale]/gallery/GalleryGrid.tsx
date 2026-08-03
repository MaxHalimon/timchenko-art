"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ProductCard, type ProductStatus } from "../components/ProductCard/ProductCard";
import styles from "./page.module.css";

export interface GridProduct {
  slug: string;
  title: string;
  previewImageUrl: string;
  widthCm: number;
  heightCm: number;
  priceUsd: number;
  status: ProductStatus;
}

const PAGE_SIZE = 24;

/**
 * Grid mode: same ProductCard grid as before, but the (already
 * server-fetched, fully filtered) list is revealed progressively —
 * PAGE_SIZE at a time — as the visitor scrolls, via an IntersectionObserver
 * on a sentinel element rather than a real paginated API. Fine at
 * hundreds of items; if the catalog grows into the thousands, this is
 * the point to switch to real cursor-based API pagination instead.
 *
 * FilterBar lives one level up (in GalleryView), shared with exhibition
 * mode rather than duplicated here.
 */
export function GalleryGrid({ products }: { products: GridProduct[] }) {
  const t = useTranslations("gallery");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset back to the first page whenever the filtered list itself
  // changes (new filters applied).
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [products]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, products.length));
        }
      },
      { rootMargin: "600px" }, // start loading well before the sentinel is actually visible
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [products.length]);

  const visible = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  return (
    <div>
      <div className={styles.grid}>
        {visible.map((product) => (
          <ProductCard key={product.slug} {...product} />
        ))}
      </div>

      <p className={styles.showingCount}>{t("showingCount", { shown: visible.length, total: products.length })}</p>

      {hasMore && <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />}
    </div>
  );
}
