
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendPrecheckPaymentSuccess } from "@/lib/email";
import { completeProduct, CompletionError } from '@/lib/completion';
import { Plan } from "@prisma/client";

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
    const reference = typeof cs.client_reference_id === 'string' ? cs.client_reference_id : '';
    const [userId, productIdFromRef, plan] = reference.split(':');
    const productId = productIdFromRef || (cs.metadata && cs.metadata.productId) || '';
    const metadataPriceCents = cs.metadata?.priceCents ? Number(cs.metadata.priceCents) : null;
    if (!productId) {
      console.error('WEBHOOK_MISSING_PRODUCT_ID', { reference, metadata: cs.metadata });
      return NextResponse.json({ received: true });
    }
    const order = await prisma.order.findFirst({ where: { stripeSessionId: cs.id } });
    let licensePriceCents: number | null = null;
    if (order) {
      await prisma.order.update({ where: { id: order.id }, data: { paidAt: new Date(), stripeSubId: (cs.subscription as string) || null } });
      await prisma.product.update({
        where: { id: productId },
        data: { status: 'PAID', paymentStatus: 'PAID' },
      });
      try {
        const completion = await completeProduct(productId);
        // License activation based on plan payment
        const now = new Date();
        const licensePlan = (plan as Plan) || order.plan;
        const priceIdMap: Record<string, string | undefined> = {
          BASIC: process.env.STRIPE_PRICE_BASIC,
          PREMIUM: process.env.STRIPE_PRICE_PREMIUM,
          LIFETIME: process.env.STRIPE_PRICE_LIFETIME,
        };
        const stripePriceId = priceIdMap[licensePlan] ?? undefined;
        if (stripePriceId) {
          try {
            const price = await stripe.prices.retrieve(stripePriceId);
            if (typeof price.unit_amount === 'number') {
              licensePriceCents = price.unit_amount;
              await prisma.order.update({
                where: { id: order.id },
                data: { priceCents: price.unit_amount },
              });
            }
          } catch (err) {
            console.error('LICENSE_PRICE_LOOKUP_ERROR', err);
          }
        } else if (metadataPriceCents) {
          licensePriceCents = metadataPriceCents;
          await prisma.order.update({ where: { id: order.id }, data: { priceCents: metadataPriceCents } });
        }
        const expiresAt =
          licensePlan === 'LIFETIME' ? null : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        await prisma.license.upsert({
          where: { productId },
          update: {
            plan: licensePlan as Plan,
            status: 'ACTIVE',
            licenseCode: completion.seal,
            certificateId: completion.certId,
            startsAt: now,
            expiresAt,
            stripeSubId: (cs.subscription as string) || null,
            stripePriceId,
            orderId: order.id,
            paidAt: now,
          },
          create: {
            productId,
            certificateId: completion.certId,
            orderId: order.id,
            plan: licensePlan as Plan,
            status: 'ACTIVE',
            licenseCode: completion.seal,
            paidAt: now,
            startsAt: now,
            expiresAt,
            stripeSubId: (cs.subscription as string) || null,
            stripePriceId,
          },
        });
      } catch (err: any) {
        if (err instanceof CompletionError) {
          if (err.code === 'PDF_NOT_READY_YET') {
            console.warn('PDF generation pending after webhook:', err.payload ?? {});
          } else if (err.code === 'CERT_EXISTS') {
            console.info('Certificate already exists for product', productId);
          } else {
            console.error('Webhook completion error', err);
          }
        } else {
          console.error('Webhook completion error', err);
        }
      }
    } else {
      // fallback: no order record (pre-check fee). Still mark product as paid.
      await prisma.product.update({
        where: { id: productId },
        data: { status: 'PAID', paymentStatus: 'PAID' },
      });
    }

    // Send confirmation for pre-check fee payments (standard or priority)
    if (plan === 'PRECHECK_FEE' || plan === 'PRECHECK_PRIORITY') {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { user: true },
      });
      if (product?.user) {
        await sendPrecheckPaymentSuccess({
          to: product.user.email,
          name: product.user.name,
          productName: product.name,
          shippingAddress: null,
          receiptPdf: undefined,
        }).catch((err) => {
          console.error('PRECHECK_PAYMENT_EMAIL_ERROR', err);
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
