
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Plan } from "@prisma/client";
import { getPublicBaseUrl } from "@/lib/baseUrl";

export const runtime = "nodejs";

const PLAN_PRICE: Record<string, string> = {
  BASIC: process.env.STRIPE_PRICE_BASIC!,
  PREMIUM: process.env.STRIPE_PRICE_PREMIUM!,
  LIFETIME: process.env.STRIPE_PRICE_LIFETIME!
};

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });
  const { plan, productId } = await req.json();
  if (!productId) return NextResponse.json({ error: 'Produkt-ID fehlt' }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId }, include: { license: true, orders: true } });
  if (!product || product.userId !== session.userId) {
    return NextResponse.json({ error: 'Produkt nicht gefunden' }, { status: 404 });
  }

  if (product.license && product.license.status === 'ACTIVE') {
    return NextResponse.json({ error: 'Lizenz bereits aktiv' }, { status: 400 });
  }
  if (product.status === 'COMPLETED' || product.paymentStatus === 'PAID') {
    return NextResponse.json({ error: 'Produkt bereits bezahlt' }, { status: 400 });
  }

  const normalizedPlan = typeof plan === 'string' ? plan.toUpperCase() : '';
  const allowedPlans: Plan[] = [Plan.BASIC, Plan.PREMIUM, Plan.LIFETIME];
  const selectedPlan = allowedPlans.find((p) => p === normalizedPlan);
  if (!selectedPlan) {
    return NextResponse.json({ error: `Plan ungültig: ${plan}` }, { status: 400 });
  }

  const priceId = PLAN_PRICE[selectedPlan];
  if (!priceId) {
    return NextResponse.json({ error: `Plan nicht konfiguriert (${selectedPlan}). Bitte STRIPE_PRICE_${selectedPlan} setzen.` }, { status: 500 });
  }

  const hasPaidOrder = product.orders.some(
    (o) => o.plan && allowedPlans.includes(o.plan as Plan) && o.paidAt
  );
  if (hasPaidOrder) {
    return NextResponse.json({ error: 'Bezahlung bereits verbucht' }, { status: 400 });
  }

  // Look up price to decide mode; Stripe will error if subscription mode is used with a one-time price.
  let checkoutMode: 'payment' | 'subscription' = selectedPlan === 'LIFETIME' ? 'payment' : 'subscription';
  let priceAmountCents: number | null = null;
  let currency: string | null = null;
  try {
    const price = await stripe.prices.retrieve(priceId);
    if (!price.recurring) {
      checkoutMode = 'payment';
    }
    if (typeof price.unit_amount === 'number') {
      priceAmountCents = price.unit_amount;
    }
    currency = (price.currency || '').toLowerCase();
  } catch (err) {
    console.error('STRIPE_PRICE_LOOKUP_ERROR', err);
    return NextResponse.json({ error: 'Preis konnte nicht geladen werden' }, { status: 500 });
  }

  if (priceAmountCents === null) {
    return NextResponse.json({ error: 'Preis nicht verfügbar' }, { status: 500 });
  }

  let stripeSession;
  try {
    const baseUrl = getPublicBaseUrl();
    stripeSession = await stripe.checkout.sessions.create(
      {
        mode: checkoutMode,
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: session.email,
        client_reference_id: `${session.userId}:${product.id}:${selectedPlan}`,
        metadata: {
          productId: product.id,
          userId: session.userId,
          plan: selectedPlan,
          priceCents: priceAmountCents,
          currency: currency ?? undefined,
        },
        success_url: `${baseUrl}/dashboard?checkout=success&productId=${encodeURIComponent(product.id)}`,
        cancel_url: `${baseUrl}/pakete?checkout=cancel&productId=${encodeURIComponent(product.id)}&plan=${selectedPlan.toLowerCase()}`,
      },
      { maxNetworkRetries: 2 }
    );
  } catch (err) {
    console.error('STRIPE_CHECKOUT_CREATE_ERROR', err);
    return NextResponse.json({ error: 'Stripe Checkout konnte nicht erstellt werden' }, { status: 500 });
  }

  await prisma.order.create({
    data: {
      userId: session.userId,
      productId: product.id,
      plan: selectedPlan,
      priceCents: priceAmountCents,
      stripeSessionId: stripeSession.id,
    },
  });

  return NextResponse.json({ url: stripeSession.url });
}
