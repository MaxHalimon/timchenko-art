"use client";

import { formatPrice } from "@/lib/currency";
import { useCurrency } from "../../providers/CurrencyProvider";

export function PriceTag({ amountUsd, className }: { amountUsd: number; className?: string }) {
  const { currency } = useCurrency();
  return <span className={className}>{formatPrice(amountUsd, currency)}</span>;
}
