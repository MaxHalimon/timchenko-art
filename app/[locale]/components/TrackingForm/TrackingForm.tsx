"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import styles from "./TrackingForm.module.css";
import buttonStyles from "../shared/Buttons.module.css";

type OrderStatus = "PREVIEW" | "PAID" | "IN_PROGRESS" | "SHIPPED" | "DELIVERED";

interface TrackResult {
  found: boolean;
  status?: OrderStatus;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  paintingTitle?: string;
}

type SubmitState = "idle" | "checking" | "done" | "error";

export function TrackingForm() {
  const t = useTranslations("tracking");
  const [reference, setReference] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [result, setResult] = useState<TrackResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reference.trim()) return;

    setState("checking");
    setResult(null);

    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: reference.trim() }),
      });

      if (!response.ok) throw new Error("Request failed");

      const data: TrackResult = await response.json();
      setResult(data);
      setState("done");
    } catch (err) {
      console.error("Order tracking lookup failed", err);
      setState("error");
    }
  }

  return (
    <div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder={t("inputPlaceholder")}
          aria-label={t("inputLabel")}
          required
          className={styles.input}
        />
        <button type="submit" className={buttonStyles.galleryButton} disabled={state === "checking"}>
          {state === "checking" ? t("checking") : t("submit")}
        </button>
      </form>

      {state === "error" && (
        <p className={`${styles.statusMessage} ${styles.statusError}`} role="alert">
          {t("error")}
        </p>
      )}

      {state === "done" && result && !result.found && (
        <p className={`${styles.statusMessage} ${styles.statusError}`} role="status">
          {t("notFound")}
        </p>
      )}

      {state === "done" && result && result.found && (
        <div className={styles.result} role="status">
          <h2 className={styles.resultHeading}>{t("resultHeading")}</h2>
          <span className={styles.statusBadge}>{t(`status.${result.status}`)}</span>

          {result.paintingTitle && (
            <p className={styles.resultRow}>
              <strong>{t("paintingLabel")}:</strong> {result.paintingTitle}
            </p>
          )}
          {result.trackingCarrier && (
            <p className={styles.resultRow}>
              <strong>{t("carrierLabel")}:</strong> {result.trackingCarrier}
            </p>
          )}
          {result.trackingNumber && (
            <p className={styles.resultRow}>
              <strong>{t("trackingNumberLabel")}:</strong> {result.trackingNumber}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
