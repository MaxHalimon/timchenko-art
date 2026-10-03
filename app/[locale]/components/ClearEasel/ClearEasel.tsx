"use client";

import { useEffect } from "react";
import { useEasel } from "../../providers/EaselProvider";

/**
 * Renders nothing. Mounted only on the post-payment success page: once the
 * customer has been sent back from Stripe/NOWPayments, the pieces they just
 * paid for no longer belong on the easel, so it is emptied here.
 *
 * Deliberately NOT done at checkout time (in the easel's submit handler):
 * if the customer cancels or closes the payment page, they should come back
 * to an easel that still holds everything they picked.
 */
export function ClearEasel() {
  const { hydrated, clearEasel } = useEasel();

  useEffect(() => {
    // Wait for the provider to have read localStorage first — clearing
    // earlier would be overwritten by the hydration read.
    if (hydrated) clearEasel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  return null;
}
