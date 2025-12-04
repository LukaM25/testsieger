import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';

export const runtime = 'nodejs';

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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.APP_URL || 'http://localhost:3000';

  const checkout = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: product.user.email,
    client_reference_id: `${session.userId}:${product.id}:${opt === 'priority' ? 'PRECHECK_PRIORITY' : 'PRECHECK_FEE'}`,
    metadata: {
      productId: product.id,
      userId: session.userId,
      plan: opt === 'priority' ? 'PRECHECK_PRIORITY' : 'PRECHECK_FEE',
    },
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/precheck?productId=${product.id}&product=${encodeURIComponent(product.name)}`,
    cancel_url: `${baseUrl}/precheck?productId=${product.id}&product=${encodeURIComponent(product.name)}`,
  });

  return NextResponse.json({ ok: true, url: checkout.url });
}
