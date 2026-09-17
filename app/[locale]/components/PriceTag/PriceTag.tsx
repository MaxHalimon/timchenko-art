"use client";

import { formatPrice } from "@/lib/currency";
import { useCurrency } from "../../providers/CurrencyProvider";

export function PriceTag({ amountEur, className }: { amountEur: number; className?: string }) {
  const { currency } = useCurrency();
  return <span className={className}>{formatPrice(amountEur, currency)}</span>;
}
