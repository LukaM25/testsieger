
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendPrecheckPaymentSuccess } from "@/lib/email";
import { ensureProcessNumber } from '@/lib/processNumber';
import { enqueueCompletionJob, processCompletionJob } from '@/lib/completion';
import { Plan } from "@prisma/client";

export const runtime = "nodejs"; // ensure Node runtime for raw body

function parseCheckoutSession(cs: any) {
  const reference = typeof cs.client_reference_id === 'string' ? cs.client_reference_id : '';
  const [, productIdFromRef, planFromRef] = reference.split(':');
  const planFromMetadata = (cs.metadata && typeof cs.metadata.plan === 'string') ? cs.metadata.plan : '';
  const plan = planFromRef || planFromMetadata || '';
  const productIdFromMetadata = (cs.metadata && typeof cs.metadata.productId === 'string') ? cs.metadata.productId : '';
  if (productIdFromRef && productIdFromMetadata && productIdFromRef !== productIdFromMetadata) {
    const err = new Error('WEBHOOK_PRODUCT_ID_MISMATCH');
    (err as any).payload = { productIdFromRef, productIdFromMetadata, reference, metadata: cs.metadata };
    throw err;
  }
  const productId = productIdFromRef || productIdFromMetadata || '';
  const metadataPriceCents = cs.metadata?.priceCents ? Number(cs.metadata.priceCents) : null;
  if (!productId) {
    const err = new Error('WEBHOOK_MISSING_PRODUCT_ID');
    (err as any).payload = { reference, metadata: cs.metadata };
    throw err;
  }
  return { reference, productId, plan, metadataPriceCents };
}

async function markProductPaid(productId: string) {
  const updated = await prisma.product.updateMany({
    where: { id: productId },
    data: { status: 'PAID', paymentStatus: 'PAID' },
  });
  if (updated.count !== 1) {
    const err = new Error('PRODUCT_NOT_FOUND');
    (err as any).payload = { productId, updatedCount: updated.count };
    throw err;
  }
}

async function handleCheckoutSession(cs: any) {
  const { reference, productId, plan, metadataPriceCents } = parseCheckoutSession(cs);
  console.info('STRIPE_CHECKOUT_SESSION_COMPLETED', { sessionId: cs.id, productId, plan });

  const order = await prisma.order.findFirst({ where: { stripeSessionId: cs.id } });
  if (order) {
    const now = new Date();
    const stripeSubId = typeof cs.subscription === 'string' ? (cs.subscription as string) : null;
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { paidAt: now, stripeSubId } });
      await tx.product.updateMany({
        where: { id: productId },
        data: { status: 'PAID', paymentStatus: 'PAID' },
      });
    });
    // License activation based on plan payment
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
    if (metadataPriceCents && Number.isFinite(metadataPriceCents)) {
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
          stripeSubId,
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
          stripeSubId,
          stripePriceId,
        },
      });
    } else {
      console.warn('WEBHOOK_LICENSE_PLAN_INVALID_SKIP_UPSERT', { licensePlan, reference, orderPlan: order.plan });
    }

    // Auto-trigger completion when license is paid and all required assets are present.
    if (isValidLicensePlan) {
      try {
        const productForAuto = await prisma.product.findUnique({
          where: { id: productId },
          select: {
            status: true,
            adminProgress: true,
            certificate: { select: { reportUrl: true, snapshotData: true } },
          },
        });
        const ratingV1 = (productForAuto?.certificate?.snapshotData as any)?.ratingV1;
        const hasLockedRating =
          Boolean(ratingV1?.lockedAt) && Boolean(ratingV1?.passEmailSentAt) && Boolean(ratingV1?.pdf?.key);
        const shouldAutoComplete =
          productForAuto?.status !== 'COMPLETED' &&
          productForAuto?.adminProgress === 'PASS' &&
          Boolean(productForAuto?.certificate?.reportUrl) &&
          hasLockedRating;
        if (shouldAutoComplete) {
          const job = await enqueueCompletionJob(productId);
          console.info('ENQUEUED_COMPLETION_JOB', { jobId: job.id, productId });
          if (process.env.RUN_COMPLETION_INLINE === 'true') {
            await processCompletionJob(job.id);
            console.info('COMPLETION_JOB_PROCESSED_INLINE', { jobId: job.id, productId });
          }
        }
      } catch (err) {
        console.error('AUTO_COMPLETION_ENQUEUE_FAILED', { productId, err });
      }
    }
  } else {
    // fallback: no order record (pre-check fee). Still mark product as paid.
    await markProductPaid(productId);
    if (plan === 'PRECHECK_FEE' || plan === 'PRECHECK_PRIORITY') {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { userId: true },
      });
      if (product?.userId) {
        await prisma.order.create({
          data: {
            userId: product.userId,
            productId,
            plan: plan as Plan,
            priceCents: metadataPriceCents ?? 0,
            stripeSessionId: cs.id,
            paidAt: new Date(),
          },
        });
      }
    }
  }

  // Send confirmation for pre-check fee payments (standard or priority)
  if (plan === 'PRECHECK_FEE' || plan === 'PRECHECK_PRIORITY') {
    const product = await prisma.product.findUnique({ where: { id: productId }, include: { user: true } });

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
