import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: 'MISSING_ORDER_ID' }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.userId },
  });
  if (!order) return NextResponse.json({ error: 'ORDER_NOT_FOUND' }, { status: 404 });
  if (!order.stripeSessionId) return NextResponse.json({ error: 'NO_SESSION' }, { status: 400 });

  try {
    const cs = await stripe.checkout.sessions.retrieve(order.stripeSessionId, {
      expand: ['payment_intent.latest_charge', 'invoice'],
    });
    const receiptUrl =
      // payment intent charge receipt
      (cs.payment_intent as any)?.latest_charge?.receipt_url ||
      // invoice hosted url
      (cs.invoice as any)?.hosted_invoice_url ||
      null;
    if (!receiptUrl) {
      return NextResponse.json({ error: 'NO_RECEIPT' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, receiptUrl });
  } catch (err) {
    console.error('RECEIPT_FETCH_ERROR', err);
    return NextResponse.json({ error: 'RECEIPT_FETCH_FAILED' }, { status: 500 });
  }
}
