"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import styles from "./FilterBar.module.css";

interface FilterBarProps {
  themeOptions: string[];
  current: { size?: string; theme?: string; status?: string };
}

const STATUS_VALUES = ["AVAILABLE", "IN_PROGRESS", "SOLD"] as const;

export function FilterBar({ themeOptions, current }: FilterBarProps) {
  const t = useTranslations("gallery.filters");
  const tThemes = useTranslations("gallery.themes");
  const tStatus = useTranslations("productCard.status");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sizeOptions = [
    { value: "small", label: t("sizeSmall") },
    { value: "medium", label: t("sizeMedium") },
    { value: "large", label: t("sizeLarge") },
  ];

  function updateFilter(key: "size" | "theme" | "status", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className={styles.filterBar}>
      <select
        className={styles.select}
        value={current.size ?? ""}
        onChange={(e) => updateFilter("size", e.target.value)}
        aria-label={t("sizeAll")}
      >
        <option value="">{t("sizeAll")}</option>
        {sizeOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        className={styles.select}
        value={current.theme ?? ""}
        onChange={(e) => updateFilter("theme", e.target.value)}
        aria-label={t("themeAll")}
      >
        <option value="">{t("themeAll")}</option>
        {themeOptions.map((theme) => (
          <option key={theme} value={theme}>
            {tThemes.has(theme) ? tThemes(theme) : theme}
          </option>
        ))}
      </select>

      <select
        className={styles.select}
        value={current.status ?? ""}
        onChange={(e) => updateFilter("status", e.target.value)}
        aria-label={t("statusAll")}
      >
        <option value="">{t("statusAll")}</option>
        {STATUS_VALUES.map((status) => (
          <option key={status} value={status}>
            {tStatus(status)}
          </option>
        ))}
      </select>
    </div>
  );
}
