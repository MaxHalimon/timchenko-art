"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useTranslations, useLocale } from "next-intl";
import styles from "./TrackingForm.module.css";
import buttonStyles from "../shared/Buttons.module.css";

type OrderStatus = "PREVIEW" | "PAID" | "PAINTING" | "DRYING" | "READY_TO_SHIP" | "SHIPPED" | "DELIVERED";

// PREVIEW isn't part of the post-purchase journey (it means "not paid
// yet") — handled as its own message below rather than a timeline step.
const STEP_ORDER: OrderStatus[] = ["PAID", "PAINTING", "DRYING", "READY_TO_SHIP", "SHIPPED", "DELIVERED"];

// An order made only of canvas prints has no painting / drying stages.
const PRINT_STEP_ORDER: OrderStatus[] = ["PAID", "PAINTING", "READY_TO_SHIP", "SHIPPED", "DELIVERED"];

interface TrackResult {
  found: boolean;
  status?: OrderStatus;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  flow?: "oil" | "print";
  items?: { title: string; variant: "ORIGINAL" | "REPAINT" | "PRINT"; quantity: number }[];
}

type SubmitState = "idle" | "checking" | "done" | "error";

interface TrackingFormProps {
  // Pre-fills the input from a "?ref=" link (order-status emails link
  // straight here) and looks it up immediately, so following that link
  // is a one-click action rather than "paste this into the form".
  initialReference?: string;
}

export function TrackingForm({ initialReference }: TrackingFormProps) {
  const t = useTranslations("tracking");
  const tItem = useTranslations("orderItem");
  const locale = useLocale();
  const [reference, setReference] = useState(initialReference ?? "");
  const [state, setState] = useState<SubmitState>("idle");
  const [result, setResult] = useState<TrackResult | null>(null);

  const lookup = useCallback(
    async (ref: string) => {
      if (!ref.trim()) return;

      setState("checking");
      setResult(null);

      try {
        const response = await fetch("/api/orders/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: ref.trim(), locale }),
        });

        if (!response.ok) throw new Error("Request failed");

        const data: TrackResult = await response.json();
        setResult(data);
        setState("done");
      } catch (err) {
        console.error("Order tracking lookup failed", err);
        setState("error");
      }
    },
    [locale]
  );

  // Auto-lookup exactly once, only when arriving with a ref already in
  // the URL — a plain visit to /tracking should never auto-submit.
  useEffect(() => {
    if (initialReference) lookup(initialReference);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await lookup(reference);
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

      {state === "done" && result && result.found && result.status === "PREVIEW" && (
        <div className={styles.result} role="status">
          <p className={styles.previewNotice}>{t("previewNotice")}</p>
        </div>
      )}

      {state === "done" && result && result.found && result.status && result.status !== "PREVIEW" && (
        <div className={styles.result} role="status">
          <h2 className={styles.resultHeading}>{t("resultHeading")}</h2>

          <ol className={styles.timeline}>
            {(result.flow === "print" ? PRINT_STEP_ORDER : STEP_ORDER).map((step, _i, steps) => {
              const currentIndex = steps.indexOf(result.status!);
              const stepIndex = steps.indexOf(step);
              const isDone = stepIndex < currentIndex;
              const isCurrent = stepIndex === currentIndex;
              return (
                <li
                  key={step}
                  className={
                    isCurrent
                      ? `${styles.timelineStep} ${styles.timelineStepCurrent}`
                      : isDone
                        ? `${styles.timelineStep} ${styles.timelineStepDone}`
                        : styles.timelineStep
                  }
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <span className={styles.timelineDot} aria-hidden="true" />
                  <span className={styles.timelineLabel}>
                    {result.flow === "print" && step === "PAINTING" ? t("statusPrint.PAINTING") : t(`status.${step}`)}
                  </span>
                </li>
              );
            })}
          </ol>

          {result.items && result.items.length > 0 && (
            <div className={styles.resultRow}>
              <strong>{t("itemsLabel")}:</strong>
              <ul>
                {result.items.map((item, index) => (
                  <li key={index}>
                    {item.title}
                    {item.quantity > 1 ? ` ×${item.quantity}` : ""} — {tItem(`variant.${item.variant}`)}
                  </li>
                ))}
              </ul>
            </div>
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
