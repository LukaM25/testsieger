import { NextResponse } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { getSession } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Schema = z.object({
  orderId: z.string().min(1),
});

function pickReceiptUrl(session: Stripe.Checkout.Session): string | null {
  const invoice = session.invoice as Stripe.Invoice | string | null | undefined;
  if (invoice && typeof invoice !== 'string') {
    return invoice.invoice_pdf || invoice.hosted_invoice_url || null;
  }

  return null;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  let input: z.infer<typeof Schema>;
  try {
    input = Schema.parse(await req.json());
  } catch (err: any) {
    if (err?.issues) return NextResponse.json({ error: 'INVALID_INPUT', issues: err.issues }, { status: 400 });
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: input.orderId, userId: session.userId },
    select: { id: true, paidAt: true, stripeSessionId: true },
  });
  if (!order) return NextResponse.json({ error: 'ORDER_NOT_FOUND' }, { status: 404 });
  if (!order.paidAt) return NextResponse.json({ error: 'ORDER_NOT_PAID' }, { status: 400 });
  if (!order.stripeSessionId) return NextResponse.json({ error: 'MISSING_STRIPE_SESSION' }, { status: 400 });

  try {
    const checkout = await stripe.checkout.sessions.retrieve(order.stripeSessionId, {
      expand: ['invoice', 'payment_intent', 'payment_intent.latest_charge'],
    });
    let receiptUrl = pickReceiptUrl(checkout);
    if (!receiptUrl && checkout.payment_intent) {
      const paymentIntent =
        typeof checkout.payment_intent === 'string'
          ? await stripe.paymentIntents.retrieve(checkout.payment_intent, { expand: ['latest_charge'] })
          : checkout.payment_intent;
      const latestCharge = paymentIntent.latest_charge;
      if (latestCharge) {
        const charge =
          typeof latestCharge === 'string' ? await stripe.charges.retrieve(latestCharge) : latestCharge;
        receiptUrl = charge.receipt_url || null;
      }
    }
    if (!receiptUrl) return NextResponse.json({ error: 'RECEIPT_UNAVAILABLE' }, { status: 404 });
    return NextResponse.json({ ok: true, receiptUrl }, { status: 200 });
  } catch (err) {
    console.error('ORDER_RECEIPT_ERROR', err);
    return NextResponse.json({ error: 'RECEIPT_LOOKUP_FAILED' }, { status: 500 });
  }
}
