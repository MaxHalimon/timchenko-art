"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEasel } from "../providers/EaselProvider";
import { PriceTag } from "../components/PriceTag/PriceTag";
import { AccentText } from "../components/AccentText/AccentText";
import buttonStyles from "../components/shared/Buttons.module.css";
import styles from "./page.module.css";

interface EaselProduct {
  slug: string;
  title: string;
  previewImageUrl: string;
  widthCm: number;
  heightCm: number;
  priceUsd: number;
  status: "AVAILABLE" | "IN_PROGRESS" | "SOLD";
}

type PaymentMethod = "card" | "crypto";
type SubmitState = "idle" | "submitting" | "error";

export default function EaselPage() {
  const t = useTranslations("easel");
  const tProductCard = useTranslations("productCard");
  const locale = useLocale();
  const { slugs, hydrated, removeFromEasel } = useEasel();

  const [products, setProducts] = useState<EaselProduct[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  useEffect(() => {
    // Wait for EaselProvider to finish reading localStorage — otherwise
    // this fires once with the placeholder empty `slugs` array (before
    // hydration) and wrongly concludes the easel has nothing on it.
    if (!hydrated) return;

    if (slugs.length === 0) {
      setProducts([]);
      setLoaded(true);
      return;
    }

    setLoaded(false);
    fetch("/api/products/by-slugs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs, locale }),
    })
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [slugs, hydrated, locale]);

  const availableProducts = products.filter((p) => p.status === "AVAILABLE");
  const totalUsd = availableProducts.reduce((sum, p) => sum + p.priceUsd, 0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (availableProducts.length === 0) return;

    setSubmitState("submitting");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlugs: availableProducts.map((p) => p.slug),
          customerName: form.get("name"),
          customerEmail: form.get("email"),
          paymentMethod,
          locale,
          shippingAddress: {
            country: form.get("country"),
            city: form.get("city"),
            postalCode: form.get("postalCode"),
            line1: form.get("line1"),
            line2: form.get("line2") || undefined,
            phone: form.get("phone"),
          },
        }),
      });

      if (!response.ok) throw new Error("Checkout failed");

      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Easel checkout failed", err);
      setSubmitState("error");
    }
  }

  if (!loaded) {
    // Still resolving the easel's real contents (localStorage read +
    // product fetch). Keep the title on screen and show a small loading
    // line — an empty gap between header and footer reads as broken,
    // and guessing "empty" here risks briefly misreporting a real cart.
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>
          <AccentText text={t("title")} />
        </h1>
        <p className={styles.empty}>{t("loading")}</p>
      </div>
    );
  }

  if (slugs.length === 0) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>
          <AccentText text={t("title")} />
        </h1>
        <p className={styles.empty}>{t("empty")}</p>
        <p className={styles.empty}>
          <Link href="/gallery" className={buttonStyles.galleryButton}>
            {t("browseGallery")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        <AccentText text={t("title")} />
      </h1>

      <div className={styles.layout}>
        <div>
          <h2 className={styles.itemsHeading}>{t("itemsHeading")}</h2>
          <div className={styles.itemList}>
            {products.map((product) => (
              <div className={styles.item} key={product.slug}>
                <Link href={`/product/${product.slug}`} className={styles.itemLink}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.previewImageUrl} alt={product.title} className={styles.itemImage} />
                  <div className={styles.itemInfo}>
                    <p className={styles.itemTitle}>{product.title}</p>
                    {product.status === "AVAILABLE" ? (
                      <p className={styles.itemMeta}>
                        {product.widthCm} × {product.heightCm} cm · <PriceTag amountUsd={product.priceUsd} />
                      </p>
                    ) : (
                      <p className={styles.itemUnavailable}>{tProductCard(`status.${product.status}`)}</p>
                    )}
                  </div>
                </Link>
                <button
                  type="button"
                  className={styles.removeButton}
                  aria-label={t("remove")}
                  onClick={() => removeFromEasel(product.slug)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className={styles.totalRow}>
            <span>{t("total")}</span>
            <PriceTag amountUsd={totalUsd} />
          </div>
        </div>

        <div className={styles.checkoutCard}>
          <h2 className={styles.checkoutHeading}>{t("checkoutHeading")}</h2>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">
                {t("form.name")}
              </label>
              <input id="name" name="name" type="text" required className={styles.input} />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                {t("form.email")}
              </label>
              <input id="email" name="email" type="email" required className={styles.input} />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="country">
                  {t("form.country")}
                </label>
                <input id="country" name="country" type="text" required className={styles.input} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="city">
                  {t("form.city")}
                </label>
                <input id="city" name="city" type="text" required className={styles.input} />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="postalCode">
                  {t("form.postalCode")}
                </label>
                <input id="postalCode" name="postalCode" type="text" required className={styles.input} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="phone">
                  {t("form.phone")}
                </label>
                <input id="phone" name="phone" type="tel" required className={styles.input} />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="line1">
                {t("form.addressLine1")}
              </label>
              <input id="line1" name="line1" type="text" required className={styles.input} />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="line2">
                {t("form.addressLine2")}
              </label>
              <input id="line2" name="line2" type="text" className={styles.input} />
            </div>

            <div className={styles.paymentChoice}>
              <button
                type="button"
                className={
                  paymentMethod === "card"
                    ? `${styles.paymentOption} ${styles.paymentOptionActive}`
                    : styles.paymentOption
                }
                onClick={() => setPaymentMethod("card")}
              >
                Card
              </button>
              <button
                type="button"
                className={
                  paymentMethod === "crypto"
                    ? `${styles.paymentOption} ${styles.paymentOptionActive}`
                    : styles.paymentOption
                }
                onClick={() => setPaymentMethod("crypto")}
              >
                Crypto
              </button>
            </div>

            <button
              type="submit"
              className={`${buttonStyles.galleryButton} ${styles.submitButton}`}
              disabled={submitState === "submitting" || availableProducts.length === 0}
            >
              {submitState === "submitting" ? t("form.submitting") : t("form.submit")}
            </button>

            {submitState === "error" && (
              <p className={`${styles.statusMessage} ${styles.statusError}`} role="alert">
                {t("error")}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
