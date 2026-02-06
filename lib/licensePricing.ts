import { Plan } from "@prisma/client";
import { stripe } from "@/lib/stripe";

export const LICENSE_PLANS: Plan[] = [Plan.BASIC, Plan.PREMIUM, Plan.LIFETIME];
export const LICENSE_PLAN_SET = new Set(LICENSE_PLANS);

const PRICE_IDS: Partial<Record<Plan, string>> = {
  BASIC: process.env.STRIPE_PRICE_BASIC,
  PREMIUM: process.env.STRIPE_PRICE_PREMIUM,
  LIFETIME: process.env.STRIPE_PRICE_LIFETIME,
};

const VAT_RATE = 0.19;
type CachedStripePrice = {
  unitAmount: number;
  taxBehavior: "inclusive" | "exclusive" | "unspecified" | null;
};
const priceCache = new Map<Plan, CachedStripePrice>();
const ANNUAL_BILLING_DAYS = 365;
const DISCOUNT_DAILY_ROUNDED_PLANS = new Set<Plan>([Plan.BASIC, Plan.PREMIUM]);

export function normalizeLicensePlan(raw: unknown): Plan | null {
  if (typeof raw !== "string") return null;
  const upper = raw.toUpperCase();
  return LICENSE_PLAN_SET.has(upper as Plan) ? (upper as Plan) : null;
}

export function discountPercentForOrderIndex(orderIndex: number) {
  if (orderIndex <= 1) return 0;
  if (orderIndex === 2) return 20;
  return 30;
}

export async function getPlanPriceCents(plan: Plan) {
  if (!LICENSE_PLAN_SET.has(plan)) {
    throw new Error(`INVALID_LICENSE_PLAN:${plan}`);
  }
  const cached = priceCache.get(plan);
  if (cached) {
    return cached.taxBehavior === "inclusive"
      ? Math.round(cached.unitAmount / (1 + VAT_RATE))
      : cached.unitAmount;
  }
  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    throw new Error(`MISSING_PRICE_ID:${plan}`);
  }
  const price = await stripe.prices.retrieve(priceId);
  if (typeof price.unit_amount !== "number") {
    throw new Error(`INVALID_PRICE_AMOUNT:${plan}`);
  }
  const next: CachedStripePrice = {
    unitAmount: price.unit_amount,
    taxBehavior: price.tax_behavior ?? null,
  };
  priceCache.set(plan, next);
  return next.taxBehavior === "inclusive" ? Math.round(next.unitAmount / (1 + VAT_RATE)) : next.unitAmount;
}

export async function getPlanPriceCentsMap(plans: Plan[]) {
  const unique = Array.from(new Set(plans.filter((plan) => LICENSE_PLAN_SET.has(plan))));
  const entries = await Promise.all(
    unique.map(async (plan) => {
      const cents = await getPlanPriceCents(plan);
      return [plan, cents] as const;
    })
  );
  return Object.fromEntries(entries) as Record<Plan, number>;
}

export function computeDiscountedPlanPriceCents(plan: Plan, basePriceCents: number, discountPercent: number) {
  const normalizedDiscount = Math.min(Math.max(discountPercent, 0), 100);
  const factor = 1 - normalizedDiscount / 100;

  // Basic/Premium are displayed as daily rates; mirror that rounding before yearly total.
  if (DISCOUNT_DAILY_ROUNDED_PLANS.has(plan)) {
    const baseDailyCents = Math.round(basePriceCents / ANNUAL_BILLING_DAYS);
    const discountedDailyCents = Math.round(baseDailyCents * factor);
    return discountedDailyCents * ANNUAL_BILLING_DAYS;
  }

  return Math.round(basePriceCents * factor);
}
