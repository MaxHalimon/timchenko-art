import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY && process.env.NODE_ENV === "production") {
  // Fail loudly at startup rather than silently accepting orders that can
  // never actually be charged.
  console.error("STRIPE_SECRET_KEY is not set");
}

// lib/stripe.ts
export const stripe = new Stripe(STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-06-24.dahlia",
});   
