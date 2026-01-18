import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { Plan } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { getPublicBaseUrl } from '@/lib/baseUrl';

export const runtime = 'nodejs';

const PRECHECK_BASE_FEE_CENTS = 22_900;
const PRECHECK_PRIORITY_ADDON_CENTS = 6_000;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { productId, productIds, option } = await req.json();
  const requestedIds = Array.isArray(productIds) && productIds.length > 0 ? productIds : productId ? [productId] : [];
  const uniqueIds = [...new Set(requestedIds.filter(Boolean))];
  if (!uniqueIds.length) return NextResponse.json({ error: 'MISSING_PRODUCT_ID' }, { status: 400 });
  const opt = option === 'priority' ? 'priority' : 'standard';

  const allProducts = await prisma.product.findMany({
    where: { userId: session.userId },
    select: { id: true, name: true, createdAt: true, paymentStatus: true },
  });
  type ProductRow = (typeof allProducts)[number];
  const selectedProducts = uniqueIds
    .map((id) => allProducts.find((product) => product.id === id))
    .filter((product): product is ProductRow => Boolean(product));
  if (selectedProducts.length !== uniqueIds.length) {
    return NextResponse.json({ error: 'PRODUCT_NOT_FOUND' }, { status: 404 });
  }

  if (selectedProducts.some((p) => p.paymentStatus === 'PAID' || p.paymentStatus === 'MANUAL')) {
    return NextResponse.json({ ok: false, alreadyPaid: true, error: 'ALREADY_PAID' }, { status: 409 });
  }

  const orderByCreated = [...allProducts].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const orderIndexById = new Map<string, number>();
  orderByCreated.forEach((p, index) => {
    orderIndexById.set(p.id, index + 1);
  });

  const lineItems = selectedProducts.map((product) => {
    const orderIndex = orderIndexById.get(product.id) ?? 1;
    const discountPercent = orderIndex <= 1 ? 0 : orderIndex === 2 ? 20 : 30;
    const discountedBase = Math.round(PRECHECK_BASE_FEE_CENTS * (1 - discountPercent / 100));
    const unitAmount = discountedBase + (opt === 'priority' ? PRECHECK_PRIORITY_ADDON_CENTS : 0);
    const name = opt === 'priority' ? `Produkttest Priority – ${product.name}` : `Produkttest – ${product.name}`;
    return {
      price_data: {
        currency: 'eur',
        unit_amount: unitAmount,
        product_data: { name },
      },
      quantity: 1,
    };
  });

  const baseUrl = getPublicBaseUrl();
  const primaryProduct = selectedProducts[0];

  const checkout = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: session.email,
    client_reference_id: `${session.userId}:${primaryProduct.id}:${opt === 'priority' ? 'PRECHECK_PRIORITY' : 'PRECHECK_FEE'}`,
    metadata: {
      productId: primaryProduct.id,
      productIds: JSON.stringify(selectedProducts.map((p) => p.id)),
      userId: session.userId,
      plan: opt === 'priority' ? 'PRECHECK_PRIORITY' : 'PRECHECK_FEE',
    },
    line_items: lineItems,
    success_url: `${baseUrl}/precheck?productId=${primaryProduct.id}&product=${encodeURIComponent(primaryProduct.name)}&checkout=success`,
    cancel_url: `${baseUrl}/precheck?productId=${primaryProduct.id}&product=${encodeURIComponent(primaryProduct.name)}&checkout=cancel`,
  });

  const orderPlan = opt === 'priority' ? Plan.PRECHECK_PRIORITY : Plan.PRECHECK_FEE;
  await prisma.order.createMany({
    data: selectedProducts.map((product) => ({
      userId: session.userId,
      productId: product.id,
      plan: orderPlan,
      priceCents: 0,
      stripeSessionId: checkout.id,
    })),
  });

  return NextResponse.json({ ok: true, url: checkout.url });
}
