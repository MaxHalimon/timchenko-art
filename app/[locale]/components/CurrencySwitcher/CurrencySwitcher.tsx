"use client";

import { SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS } from "@/lib/currency";
import { useCurrency } from "../../providers/CurrencyProvider";
import styles from "../shared/HeaderSelect.module.css";

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();

  return (
    <select
      aria-label="Currency"
      value={currency}
      onChange={(e) => setCurrency(e.target.value as (typeof SUPPORTED_CURRENCIES)[number])}
      className={styles.select}
    >
      {SUPPORTED_CURRENCIES.map((code) => (
        <option key={code} value={code}>
          {CURRENCY_SYMBOLS[code]} {code}
        </option>
      ))}
    </select>
  );
}
