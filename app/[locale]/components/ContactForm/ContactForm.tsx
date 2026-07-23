"use client";

import { useState, type FormEvent } from "react";
import emailjs from "@emailjs/browser";
import { useTranslations } from "next-intl";
import styles from "./ContactForm.module.css";
import buttonStyles from "../shared/Buttons.module.css";

type SubmitState = "idle" | "sending" | "success" | "error";

/**
 * Sends the form directly from the browser via EmailJS — no backend route
 * needed. Requires three public env vars (safe to expose; that's how
 * EmailJS is designed — see EMAILJS_GUIDE.md at the project root for how
 * to obtain them and how the linked template must be configured):
 *   NEXT_PUBLIC_EMAILJS_SERVICE_ID
 *   NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
 *   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
 */
export function ContactForm() {
  const t = useTranslations("contact.form");
  const [state, setState] = useState<SubmitState>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");

    const form = event.currentTarget;
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      console.error("EmailJS is not configured — missing NEXT_PUBLIC_EMAILJS_* env vars.");
      setState("error");
      return;
    }

    try {
      // Template param names below (from_name, reply_to, message) must match
      // the variables used inside your EmailJS template — see the guide.
      await emailjs.sendForm(serviceId, templateId, form, { publicKey });
      setState("success");
      form.reset();
    } catch (err) {
      console.error("EmailJS send failed", err);
      setState("error");
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="from_name">
          {t("nameLabel")}
        </label>
        <input
          id="from_name"
          name="from_name"
          type="text"
          required
          placeholder={t("namePlaceholder")}
          className={styles.input}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="reply_to">
          {t("emailLabel")}
        </label>
        <input
          id="reply_to"
          name="reply_to"
          type="email"
          required
          placeholder={t("emailPlaceholder")}
          className={styles.input}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="message">
          {t("messageLabel")}
        </label>
        <textarea
          id="message"
          name="message"
          required
          placeholder={t("messagePlaceholder")}
          className={styles.textarea}
        />
      </div>

      <div className={styles.submitRow}>
        <button type="submit" className={buttonStyles.galleryButton} disabled={state === "sending"}>
          {state === "sending" ? t("sending") : t("submit")}
        </button>
      </div>

      {state === "success" && (
        <p className={`${styles.statusMessage} ${styles.statusSuccess}`} role="status">
          {t("success")}
        </p>
      )}
      {state === "error" && (
        <p className={`${styles.statusMessage} ${styles.statusError}`} role="alert">
          {t("error")}
        </p>
      )}
    </form>
  );
}
