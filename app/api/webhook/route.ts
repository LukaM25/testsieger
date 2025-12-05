
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendPrecheckPaymentSuccess } from "@/lib/email";
import { enqueueCompletionJob } from '@/lib/completion';
import { Plan } from "@prisma/client";

export const runtime = "nodejs"; // ensure Node runtime for raw body

async function handleCheckoutSession(cs: any) {
  const reference = typeof cs.client_reference_id === 'string' ? cs.client_reference_id : '';
  const [userId, productIdFromRef, planFromRef] = reference.split(':');
  const planFromMetadata = (cs.metadata && typeof cs.metadata.plan === 'string') ? cs.metadata.plan : '';
  const plan = planFromRef || planFromMetadata || '';
  const productIdFromMetadata = (cs.metadata && typeof cs.metadata.productId === 'string') ? cs.metadata.productId : '';
  if (productIdFromRef && productIdFromMetadata && productIdFromRef !== productIdFromMetadata) {
    console.error('WEBHOOK_PRODUCT_ID_MISMATCH', { productIdFromRef, productIdFromMetadata, reference, metadata: cs.metadata });
    return;
  }
  const productId = productIdFromRef || productIdFromMetadata || '';
  const metadataPriceCents = cs.metadata?.priceCents ? Number(cs.metadata.priceCents) : null;
  if (!productId) {
    console.error('WEBHOOK_MISSING_PRODUCT_ID', { reference, metadata: cs.metadata });
    return;
  }

  const order = await prisma.order.findFirst({ where: { stripeSessionId: cs.id } });
  if (order) {
    await prisma.order.update({ where: { id: order.id }, data: { paidAt: new Date(), stripeSubId: (cs.subscription as string) || null } });
    await prisma.product.update({
      where: { id: productId },
      data: { status: 'PAID', paymentStatus: 'PAID' },
    });
    // License activation based on plan payment
    const now = new Date();
    const VALID_LICENSE_PLANS: Plan[] = ['BASIC', 'PREMIUM', 'LIFETIME'];
    const planFromReference = plan as Plan;
    const planFromOrder = order.plan;
    const planMismatch =
      plan &&
      planFromOrder &&
      VALID_LICENSE_PLANS.includes(planFromReference) &&
      planFromReference !== planFromOrder;
    if (planMismatch) {
      console.error('WEBHOOK_PLAN_MISMATCH', { planFromReference, planFromOrder, reference });
    }
    const licensePlan = VALID_LICENSE_PLANS.includes(planFromReference) ? planFromReference : planFromOrder;
    const isValidLicensePlan = VALID_LICENSE_PLANS.includes(licensePlan as Plan);
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
          await prisma.order.update({
            where: { id: order.id },
            data: { priceCents: price.unit_amount },
          });
        }
      } catch (err) {
        console.error('LICENSE_PRICE_LOOKUP_ERROR', err);
      }
    } else if (metadataPriceCents) {
      await prisma.order.update({ where: { id: order.id }, data: { priceCents: metadataPriceCents } });
    }
    const expiresAt =
      licensePlan === 'LIFETIME' ? null : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    if (isValidLicensePlan) {
      const existingLicense = await prisma.license.findUnique({ where: { productId } });
      const statusForUpdate = 'ACTIVE';
      const startsAtForUpdate = existingLicense?.startsAt ?? now;
      await prisma.license.upsert({
        where: { productId },
        update: {
          plan: licensePlan as Plan,
          status: statusForUpdate,
          paidAt: now,
          startsAt: startsAtForUpdate,
          expiresAt,
          stripeSubId: (cs.subscription as string) || null,
          stripePriceId,
          orderId: order.id,
        },
        create: {
          productId,
          orderId: order.id,
          plan: licensePlan as Plan,
          status: 'ACTIVE',
          licenseCode: `PENDING-${productId}`,
          paidAt: now,
          startsAt: now,
          expiresAt,
          stripeSubId: (cs.subscription as string) || null,
          stripePriceId,
        },
      });
    } else {
      console.warn('WEBHOOK_LICENSE_PLAN_INVALID_SKIP_UPSERT', { licensePlan, reference, orderPlan: order.plan });
    }

    try {
      const job = await enqueueCompletionJob(productId);
      console.info('ENQUEUED_COMPLETION_JOB', { jobId: job.id, productId });
    } catch (err) {
      console.error('ENQUEUE_COMPLETION_JOB_FAILED', { productId, error: err });
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

    if (product?.user) {
      await sendPrecheckPaymentSuccess({
        to: product.user.email,
        name: product.user.name,
        productName: product.name,
        processNumber: product.id,
        receiptPdf,
      }).catch((err) => {
        console.error('PRECHECK_PAYMENT_EMAIL_ERROR', err);
      });
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
    try {
      await handleCheckoutSession(event.data.object as any);
    } catch (err) {
      console.error('WEBHOOK_CHECKOUT_HANDLER_ERROR', err);
    }
  }

  return NextResponse.json({ received: true });
}
