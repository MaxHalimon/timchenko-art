"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { ProductCard, type ProductStatus } from "../ProductCard/ProductCard";
import styles from "./ProductCarousel.module.css";

export interface CarouselProduct {
  slug: string;
  title: string;
  previewImageUrl: string;
  widthCm: number;
  heightCm: number;
  priceUsd: number;
  status: ProductStatus;
}

export function ProductCarousel({ products }: { products: CarouselProduct[] }) {
  const t = useTranslations("home");
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const firstItem = track.firstElementChild as HTMLElement | null;
    const step = (firstItem?.offsetWidth ?? 260) + 24; // item width + gap
    track.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowLeft}`}
        aria-label={t("carouselPrev")}
        onClick={() => scroll(-1)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className={styles.track} ref={trackRef}>
        {products.map((product) => (
          <div className={styles.item} key={product.slug}>
            <ProductCard {...product} />
          </div>
        ))}
      </div>

      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowRight}`}
        aria-label={t("carouselNext")}
        onClick={() => scroll(1)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
