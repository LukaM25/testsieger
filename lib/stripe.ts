import Stripe from "stripe";

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2024-06-20";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY && process.env.NODE_ENV === 'production') {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

if (!STRIPE_SECRET_KEY && process.env.NODE_ENV !== 'production') {
  console.warn("[stripe] STRIPE_SECRET_KEY not set; Stripe client will throw if used.");
}

export const stripe = new Stripe(STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: STRIPE_API_VERSION,
});
