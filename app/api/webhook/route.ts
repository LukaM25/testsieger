
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs"; // ensure Node runtime for raw body

export async function POST(req: Request) {
  const buf = Buffer.from(await req.arrayBuffer());
  const sig = req.headers.get('stripe-signature')!;
  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const cs = event.data.object as any;
    const [userId, productId, plan] = (cs.client_reference_id as string).split(':');
    const order = await prisma.order.findFirst({ where: { stripeSessionId: cs.id } });
    if (order) {
      await prisma.order.update({ where: { id: order.id }, data: { paidAt: new Date(), stripeSubId: (cs.subscription as string) || null } });
      await prisma.product.update({ where: { id: productId }, data: { status: 'PAID' } });
    }
  }

  return NextResponse.json({ received: true });
}
