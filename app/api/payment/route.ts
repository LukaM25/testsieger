
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PLAN_PRICE: Record<string, string> = {
  BASIC: process.env.STRIPE_PRICE_BASIC!,
  PREMIUM: process.env.STRIPE_PRICE_PREMIUM!,
  LIFETIME: process.env.STRIPE_PRICE_LIFETIME!
};

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });
  const { plan } = await req.json();
  const latestProduct = await prisma.product.findFirst({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' } });
  if (!latestProduct) return NextResponse.json({ error: 'Kein Produkt' }, { status: 400 });

  const priceId = PLAN_PRICE[plan];
  if (!priceId) return NextResponse.json({ error: 'Plan ungültig' }, { status: 400 });

  const stripeSession = await stripe.checkout.sessions.create({
    mode: plan === 'LIFETIME' ? 'payment' : 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: `${session.userId}:${latestProduct.id}:${plan}`,
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/packages`
  });

  await prisma.order.create({
    data: {
      userId: session.userId,
      productId: latestProduct.id,
      plan,
      priceCents: 0,
      stripeSessionId: stripeSession.id
    }
  });

  return NextResponse.json({ url: stripeSession.url });
}
