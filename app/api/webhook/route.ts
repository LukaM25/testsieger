
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendPrecheckPaymentSuccess } from "@/lib/email";
import { ensureProcessNumber } from '@/lib/processNumber';
import { Plan } from "@prisma/client";

export const runtime = "nodejs"; // ensure Node runtime for raw body

function parseCheckoutSession(cs: any) {
  const reference = typeof cs.client_reference_id === 'string' ? cs.client_reference_id : '';
  const [, productIdFromRef, planFromRef] = reference.split(':');
  const planFromMetadata = (cs.metadata && typeof cs.metadata.plan === 'string') ? cs.metadata.plan : '';
  const plan = planFromRef || planFromMetadata || '';
  const productIdFromMetadata = (cs.metadata && typeof cs.metadata.productId === 'string') ? cs.metadata.productId : '';
  const cartId = (cs.metadata && typeof cs.metadata.cartId === 'string') ? cs.metadata.cartId : '';
  const productIdsRaw = cs.metadata && typeof cs.metadata.productIds === 'string' ? cs.metadata.productIds : '';
  let productIdsFromMetadata: string[] = [];
  if (productIdsRaw) {
    try {
      const parsed = JSON.parse(productIdsRaw);
      if (Array.isArray(parsed)) {
        productIdsFromMetadata = parsed.map((id) => String(id)).filter(Boolean);
      } else if (typeof parsed === 'string') {
        productIdsFromMetadata = [parsed];
      }
    } catch {
      productIdsFromMetadata = productIdsRaw.split(',').map((id: string) => id.trim()).filter(Boolean);
    }
  }
  if (!productIdsFromMetadata.length && productIdFromMetadata) {
    productIdsFromMetadata = [productIdFromMetadata];
  }
  const productIds = productIdsFromMetadata.length ? productIdsFromMetadata : productIdFromRef ? [productIdFromRef] : [];
  const uniqueProductIds = [...new Set(productIds)];
  if (productIdFromRef && productIdsFromMetadata.length === 1 && productIdsFromMetadata[0] !== productIdFromRef) {
    const err = new Error('WEBHOOK_PRODUCT_ID_MISMATCH');
    (err as any).payload = { productIdFromRef, productIdFromMetadata, reference, metadata: cs.metadata };
    throw err;
  }
  const metadataPriceCents = cs.metadata?.priceCents ? Number(cs.metadata.priceCents) : null;
  if (!uniqueProductIds.length) {
    const err = new Error('WEBHOOK_MISSING_PRODUCT_ID');
    (err as any).payload = { reference, metadata: cs.metadata };
    throw err;
  }
  return { reference, productIds: uniqueProductIds, plan, metadataPriceCents, cartId };
}

async function markProductsPaid(productIds: string[]) {
  const uniqueIds = [...new Set(productIds)];
  const updated = await prisma.product.updateMany({
    where: { id: { in: uniqueIds } },
    data: { status: 'PAID', paymentStatus: 'PAID' },
  });
  if (updated.count !== uniqueIds.length) {
    const err = new Error('PRODUCT_NOT_FOUND');
    (err as any).payload = { productIds: uniqueIds, updatedCount: updated.count };
    throw err;
  }
}

async function handleCheckoutSession(cs: any) {
  const { reference, productIds, plan, metadataPriceCents, cartId } = parseCheckoutSession(cs);
  const primaryProductId = productIds[0];
  console.info('STRIPE_CHECKOUT_SESSION_COMPLETED', { sessionId: cs.id, productIds, plan });

  const orders = await prisma.order.findMany({ where: { stripeSessionId: cs.id } });
  const isPrecheckPlan = plan === 'PRECHECK_FEE' || plan === 'PRECHECK_PRIORITY';
  if (orders.length) {
    const now = new Date();
    const stripeSubId = typeof cs.subscription === 'string' ? (cs.subscription as string) : null;
    const orderProductIds = orders.map((order) => order.productId);
    const paidProductIds = [...new Set([...productIds, ...orderProductIds])];
    const missingPrecheckProductIds =
      isPrecheckPlan ? productIds.filter((id) => !orderProductIds.includes(id)) : [];
    await prisma.$transaction(async (tx) => {
      if (missingPrecheckProductIds.length) {
        const userId = orders[0]?.userId;
        if (userId) {
          await tx.order.createMany({
            data: missingPrecheckProductIds.map((productId) => ({
              userId,
              productId,
              plan: plan as Plan,
              priceCents: metadataPriceCents ?? 0,
              stripeSessionId: cs.id,
            })),
          });
        }
      }
      await tx.order.updateMany({ where: { stripeSessionId: cs.id }, data: { paidAt: now, stripeSubId } });
      await tx.product.updateMany({
        where: { id: { in: paidProductIds } },
        data: { status: 'PAID', paymentStatus: 'PAID' },
      });
    });
    // License activation based on plan payment
    const VALID_LICENSE_PLANS: Plan[] = ['BASIC', 'PREMIUM', 'LIFETIME'];
    const priceIdMap: Record<string, string | undefined> = {
      BASIC: process.env.STRIPE_PRICE_BASIC,
      PREMIUM: process.env.STRIPE_PRICE_PREMIUM,
      LIFETIME: process.env.STRIPE_PRICE_LIFETIME,
    };
    if (metadataPriceCents && Number.isFinite(metadataPriceCents) && orders.length === 1 && orders[0]?.id) {
      await prisma.order.update({ where: { id: orders[0].id }, data: { priceCents: metadataPriceCents } });
    }
    const licenseOrders = orders.filter((order) => VALID_LICENSE_PLANS.includes(order.plan as Plan));
    for (const order of licenseOrders) {
      const licensePlan = order.plan as Plan;
      const expiresAt =
        licensePlan === 'LIFETIME' ? null : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      const stripePriceId = priceIdMap[licensePlan] ?? undefined;
      const existingLicense = await prisma.license.findUnique({ where: { productId: order.productId } });
      const startsAtForUpdate = existingLicense?.startsAt ?? now;
      await prisma.license.upsert({
        where: { productId: order.productId },
        update: {
          plan: licensePlan,
          status: 'ACTIVE',
          paidAt: now,
          startsAt: startsAtForUpdate,
          expiresAt,
          stripeSubId,
          stripePriceId,
          orderId: order.id,
        },
        create: {
          productId: order.productId,
          orderId: order.id,
          plan: licensePlan,
          status: 'ACTIVE',
          licenseCode: `PENDING-${order.productId}`,
          paidAt: now,
          startsAt: now,
          expiresAt,
          stripeSubId,
          stripePriceId,
        },
      });
    }
    if (!licenseOrders.length && plan) {
      const planFromReference = plan as Plan;
      const planFromOrder = orders[0]?.plan;
      const planMismatch =
        plan &&
        planFromOrder &&
        VALID_LICENSE_PLANS.includes(planFromReference) &&
        planFromReference !== planFromOrder;
      if (planMismatch) {
        console.error('WEBHOOK_PLAN_MISMATCH', { planFromReference, planFromOrder, reference });
      }
    }

    if (cartId) {
      await prisma.licenseCartItem.deleteMany({ where: { cartId } });
    }

    // Completion is only triggered manually by admins.
  } else {
    // fallback: no order record (pre-check fee). Still mark product(s) as paid.
    await markProductsPaid(productIds);
    if (isPrecheckPlan) {
      const product = await prisma.product.findUnique({
        where: { id: primaryProductId },
        select: { userId: true },
      });
      if (product?.userId) {
        await prisma.order.createMany({
          data: productIds.map((productId) => ({
            userId: product.userId,
            productId,
            plan: plan as Plan,
            priceCents: metadataPriceCents ?? 0,
            stripeSessionId: cs.id,
            paidAt: new Date(),
          })),
        });
      }
    }
  }

  // Send confirmation for pre-check fee payments (standard or priority)
  if (plan === 'PRECHECK_FEE' || plan === 'PRECHECK_PRIORITY') {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { user: true },
    });

    let receiptPdf: Buffer | undefined;
    if (typeof (cs as any).invoice === 'string') {
      try {
        const invoice = await stripe.invoices.retrieve((cs as any).invoice as string);
        const pdfUrl = (invoice as any).invoice_pdf as string | null | undefined;
        if (pdfUrl) {
          const res = await fetch(pdfUrl);
          if (res.ok) {
            const arr = await res.arrayBuffer();
            receiptPdf = Buffer.from(arr);
          }
        }
      } catch (err) {
        console.warn('INVOICE_PDF_FETCH_FAIL', err);
      }
    }

    for (const product of products) {
      if (!product?.user) continue;
      try {
        const processNumber = await ensureProcessNumber(product.id);
        await sendPrecheckPaymentSuccess({
          to: product.user.email,
          name: product.user.name,
          productName: product.name,
          processNumber,
          receiptPdf,
        });
      } catch (err) {
        console.error('PRECHECK_PAYMENT_EMAIL_ERROR', err);
      }
    }
  }
}

export async function POST(req: Request) {
  const buf = Buffer.from(await req.arrayBuffer());
  const sig = req.headers.get('stripe-signature')!;
  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    await handleCheckoutSession(event.data.object as any).catch((err) => {
      console.error('WEBHOOK_CHECKOUT_HANDLER_ERROR', err, (err as any)?.payload ? { payload: (err as any).payload } : undefined);
      throw err;
    });
  }

  return NextResponse.json({ received: true });
}
