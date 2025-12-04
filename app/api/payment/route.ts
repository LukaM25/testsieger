
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Plan } from "@prisma/client";

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
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.userId !== session.userId) {
    return NextResponse.json({ error: 'Produkt nicht gefunden' }, { status: 404 });
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

  // Look up price to decide mode; Stripe will error if subscription mode is used with a one-time price.
  let checkoutMode: 'payment' | 'subscription' = selectedPlan === 'LIFETIME' ? 'payment' : 'subscription';
  let priceAmountCents: number | null = null;
  try {
    const price = await stripe.prices.retrieve(priceId);
    if (!price.recurring) {
      checkoutMode = 'payment';
    }
    if (typeof price.unit_amount === 'number') {
      priceAmountCents = price.unit_amount;
    }
  } catch (err) {
    console.error('STRIPE_PRICE_LOOKUP_ERROR', err);
    return NextResponse.json({ error: 'Preis konnte nicht geladen werden' }, { status: 500 });
  }

  let stripeSession;
  try {
    stripeSession = await stripe.checkout.sessions.create(
      {
        mode: checkoutMode,
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: `${session.userId}:${product.id}:${selectedPlan}`,
        metadata: {
          productId: product.id,
          userId: session.userId,
          plan: selectedPlan,
          priceCents: priceAmountCents ?? null,
        },
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pakete`,
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
      priceCents: 0,
      stripeSessionId: stripeSession.id,
    },
  });

  return NextResponse.json({ url: stripeSession.url });
}
