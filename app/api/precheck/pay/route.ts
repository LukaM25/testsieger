import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { Plan } from '@prisma/client';
import { getSession } from '@/lib/cookies';
import { getPublicBaseUrl } from '@/lib/baseUrl';

export const runtime = 'nodejs';

const PRECHECK_COUPON_ENV: Record<10 | 20 | 30, string> = {
  10: 'STRIPE_COUPON_PRECHECK_10',
  20: 'STRIPE_COUPON_PRECHECK_20',
  30: 'STRIPE_COUPON_PRECHECK_30',
};

async function getOrCreatePrecheckCouponId(percentOff: 10 | 20 | 30) {
  const envKey = PRECHECK_COUPON_ENV[percentOff];
  const fromEnv = process.env[envKey];
  if (fromEnv) return fromEnv;

  const g = globalThis as typeof globalThis & {
    __precheckCoupons?: Partial<Record<10 | 20 | 30, string>>;
  };
  g.__precheckCoupons ||= {};
  const cached = g.__precheckCoupons[percentOff];
  if (cached) return cached;

  const created = await stripe.coupons.create({
    duration: 'once',
    percent_off: percentOff,
    name: `Precheck ${percentOff}%`,
  });
  g.__precheckCoupons[percentOff] = created.id;
  return created.id;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { productId, option } = await req.json();
  if (!productId) return NextResponse.json({ error: 'MISSING_PRODUCT_ID' }, { status: 400 });
  const opt = option === 'priority' ? 'priority' : 'standard';
  const DEFAULT_STANDARD_PRICE = 'price_1SY6z53Ex7yEO9qtNrhwagoQ';
  const DEFAULT_PRIORITY_PRICE = 'price_1SY72M3Ex7yEO9qtTiZC1LoS';
  const standardPriceId =
    process.env.STRIPE_PRICE_PRECHECK_STANDARD ||
    process.env.NEXT_PUBLIC_STRIPE_PRICE_PRECHECK_STANDARD ||
    process.env.STRIPE_PRICE_PRECHECK_FEE ||
    DEFAULT_STANDARD_PRICE;
  const priorityPriceId =
    process.env.STRIPE_PRICE_PRECHECK_PRIORITY ||
    process.env.NEXT_PUBLIC_STRIPE_PRICE_PRECHECK_PRIORITY ||
    process.env.STRIPE_PRICE_PRECHECK_EXPRESS ||
    DEFAULT_PRIORITY_PRICE;

  const priceId = opt === 'priority' ? priorityPriceId : standardPriceId;

  if (!priceId) {
    return NextResponse.json({ error: 'PRICE_NOT_CONFIGURED' }, { status: 500 });
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, userId: session.userId },
    include: { user: true },
  });
  if (!product) return NextResponse.json({ error: 'PRODUCT_NOT_FOUND' }, { status: 404 });

  // If already paid, do not create another checkout session.
  if (product.paymentStatus === 'PAID' || product.paymentStatus === 'MANUAL') {
    return NextResponse.json({ ok: true, alreadyPaid: true });
  }

  const baseUrl = getPublicBaseUrl();

  const paidCount = await prisma.product.count({
    where: {
      userId: session.userId,
      id: { not: product.id },
      paymentStatus: { in: ['PAID', 'MANUAL'] },
    },
  });
  const discountPercent = Math.min(30, Math.max(0, paidCount * 10));
  const couponId =
    discountPercent === 10 || discountPercent === 20 || discountPercent === 30
      ? await getOrCreatePrecheckCouponId(discountPercent)
      : null;

  const checkout = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: product.user.email,
    client_reference_id: `${session.userId}:${product.id}:${opt === 'priority' ? 'PRECHECK_PRIORITY' : 'PRECHECK_FEE'}`,
    metadata: {
      productId: product.id,
      userId: session.userId,
      plan: opt === 'priority' ? 'PRECHECK_PRIORITY' : 'PRECHECK_FEE',
      precheckDiscountPercent: String(discountPercent),
    },
    discounts: couponId ? [{ coupon: couponId }] : undefined,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/precheck?productId=${product.id}&product=${encodeURIComponent(product.name)}&checkout=success`,
    cancel_url: `${baseUrl}/precheck?productId=${product.id}&product=${encodeURIComponent(product.name)}&checkout=cancel`,
  });

  const orderPlan = opt === 'priority' ? Plan.PRECHECK_PRIORITY : Plan.PRECHECK_FEE;
  await prisma.order.create({
    data: {
      userId: session.userId,
      productId: product.id,
      plan: orderPlan,
      priceCents: 0,
      stripeSessionId: checkout.id,
    },
  });

  return NextResponse.json({ ok: true, url: checkout.url });
}
