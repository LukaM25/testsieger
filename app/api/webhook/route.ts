import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendPrecheckPaymentSuccess } from "@/lib/email";
import { ensureProcessNumber } from "@/lib/processNumber";
import { Plan } from "@prisma/client";
import {
  createEasybillInvoiceForPaidCheckout,
  type EasybillLine,
} from "@/lib/easybill";

export const runtime = "nodejs";

function parseCheckoutSession(cs: any) {
  const reference =
    typeof cs.client_reference_id === "string" ? cs.client_reference_id : "";
  const [, refSecond = "", refThird = ""] = reference.split(":");
  const isLicenseCartReference = refSecond === "license-cart";
  const productIdFromRef = isLicenseCartReference ? "" : refSecond;
  const planFromRef = isLicenseCartReference ? "" : refThird;
  const cartIdFromRef = isLicenseCartReference ? refThird : "";
  const planFromMetadata =
    cs.metadata && typeof cs.metadata.plan === "string"
      ? cs.metadata.plan
      : "";
  const plan = planFromRef || planFromMetadata || "";
  const productIdFromMetadata =
    cs.metadata && typeof cs.metadata.productId === "string"
      ? cs.metadata.productId
      : "";
  const cartId =
    cs.metadata && typeof cs.metadata.cartId === "string"
      ? cs.metadata.cartId
      : cartIdFromRef;
  const productIdsRaw =
    cs.metadata && typeof cs.metadata.productIds === "string"
      ? cs.metadata.productIds
      : "";

  let productIdsFromMetadata: string[] = [];

  if (productIdsRaw) {
    try {
      const parsed = JSON.parse(productIdsRaw);
      if (Array.isArray(parsed)) {
        productIdsFromMetadata = parsed.map((id) => String(id)).filter(Boolean);
      } else if (typeof parsed === "string") {
        productIdsFromMetadata = [parsed];
      }
    } catch {
      productIdsFromMetadata = productIdsRaw
        .split(",")
        .map((id: string) => id.trim())
        .filter(Boolean);
    }
  }

  if (!productIdsFromMetadata.length && productIdFromMetadata) {
    productIdsFromMetadata = [productIdFromMetadata];
  }

  const productIds = productIdsFromMetadata.length
    ? productIdsFromMetadata
    : productIdFromRef
    ? [productIdFromRef]
    : [];

  const uniqueProductIds = [...new Set(productIds)];

  if (
    productIdFromRef &&
    productIdsFromMetadata.length === 1 &&
    productIdsFromMetadata[0] !== productIdFromRef
  ) {
    const err = new Error("WEBHOOK_PRODUCT_ID_MISMATCH");
    (err as any).payload = {
      productIdFromRef,
      productIdFromMetadata,
      reference,
      metadata: cs.metadata,
    };
    throw err;
  }

  const metadataPriceCents = cs.metadata?.priceCents
    ? Number(cs.metadata.priceCents)
    : null;

  if (!uniqueProductIds.length) {
    const err = new Error("WEBHOOK_MISSING_PRODUCT_ID");
    (err as any).payload = { reference, metadata: cs.metadata };
    throw err;
  }

  return {
    reference,
    productIds: uniqueProductIds,
    plan,
    metadataPriceCents,
    cartId,
  };
}

async function markProductsPaid(productIds: string[]) {
  const uniqueIds = [...new Set(productIds)];

  const updated = await prisma.product.updateMany({
    where: { id: { in: uniqueIds } },
    data: { status: "PAID", paymentStatus: "PAID" },
  });

  if (updated.count !== uniqueIds.length) {
    const err = new Error("PRODUCT_NOT_FOUND");
    (err as any).payload = {
      productIds: uniqueIds,
      updatedCount: updated.count,
    };
    throw err;
  }
}

async function getStripeCheckoutLineItems(sessionId: string) {
  const result = await stripe.checkout.sessions.listLineItems(sessionId, {
    limit: 100,
  });

  return result.data.map((item) => ({
    stripePriceId:
      typeof item.price === "object" && item.price
        ? item.price.id
        : typeof item.price === "string"
        ? item.price
        : null,
    description: item.description ?? "Position",
    quantity: item.quantity ?? 1,
    subtotalCents: item.amount_subtotal ?? 0,
    discountCents: item.amount_discount ?? 0,
    totalCents: item.amount_total ?? 0,
  }));
}

function splitAmountEvenly(total: number, parts: number) {
  if (parts <= 0) return [];

  const base = Math.floor(total / parts);
  let remainder = total - base * parts;

  return Array.from({ length: parts }, () => {
    const value = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    return value;
  });
}

async function enrichOrdersFromStripeSession(sessionId: string) {
  const orders = await prisma.order.findMany({
    where: { stripeSessionId: sessionId },
    orderBy: { id: "asc" },
  });

  if (!orders.length) return orders;

  const stripeItems = await getStripeCheckoutLineItems(sessionId);

  if (!stripeItems.length) return orders;

  if (stripeItems.length === 1) {
    const item = stripeItems[0];

    const targetOrders = orders.filter(
      (o) =>
        !item.stripePriceId || !o.stripePriceId || o.stripePriceId === item.stripePriceId
    );

    const scopedOrders = targetOrders.length ? targetOrders : orders;
    const unitSubtotals = splitAmountEvenly(
      item.subtotalCents,
      scopedOrders.length
    );
    const unitDiscounts = splitAmountEvenly(
      item.discountCents,
      scopedOrders.length
    );
    const unitTotals = splitAmountEvenly(item.totalCents, scopedOrders.length);

    for (let i = 0; i < scopedOrders.length; i += 1) {
      await prisma.order.update({
        where: { id: scopedOrders[i].id },
        data: {
          priceCents: unitTotals[i],
          stripePriceId: item.stripePriceId ?? scopedOrders[i].stripePriceId,
          stripeCurrency: "eur",
          stripeUnitAmountCents: unitSubtotals[i],
          stripeSubtotalCents: unitSubtotals[i],
          stripeDiscountCents: unitDiscounts[i],
          stripeTotalCents: unitTotals[i],
        },
      });
    }
  }

  return prisma.order.findMany({
    where: { stripeSessionId: sessionId },
    orderBy: { id: "asc" },
  });
}

async function buildEasybillLinesForSession(
  sessionId: string,
  productIds: string[]
): Promise<EasybillLine[]> {
  const lineItems = await getStripeCheckoutLineItems(sessionId);

  if (!lineItems.length) return [];

  if (lineItems.length === 1 && productIds.length > 1) {
    const line = lineItems[0];

    const subtotals = splitAmountEvenly(line.subtotalCents, productIds.length);
    const discounts = splitAmountEvenly(line.discountCents, productIds.length);
    const totals = splitAmountEvenly(line.totalCents, productIds.length);

    return productIds.map((productId, index) => ({
      stripePriceId: line.stripePriceId || "",
      description: `${line.description} - ${productId}`,
      quantity: 1,
      subtotalCents: subtotals[index],
      discountCents: discounts[index],
      totalCents: totals[index],
    }));
  }

  return lineItems.map((line) => ({
    stripePriceId: line.stripePriceId || "",
    description: line.description,
    quantity: line.quantity,
    subtotalCents: line.subtotalCents,
    discountCents: line.discountCents,
    totalCents: line.totalCents,
  }));
}

async function syncEasybillForSession(params: {
  sessionId: string;
  productIds: string[];
}) {
  const { sessionId, productIds } = params;

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { user: true },
  });

  const recipient = products.find((p) => p.user)?.user;

  if (!recipient) {
    console.warn("EASYBILL_SKIPPED_NO_RECIPIENT", {
      sessionId,
      productIds,
    });
    return;
  }

  const lines = await buildEasybillLinesForSession(sessionId, productIds);

  if (!lines.length) {
    console.warn("EASYBILL_SKIPPED_NO_LINES", { sessionId, productIds });
    return;
  }

  const result = await createEasybillInvoiceForPaidCheckout({
    externalId: sessionId,
    customer: {
      name: recipient.name,
      email: recipient.email,
      address: null,
    },
    lines,
  });

  await prisma.order.updateMany({
    where: { stripeSessionId: sessionId },
    data: {
      easybillCustomerId: result.customerId,
      easybillDocumentId: result.documentId,
      easybillDocumentNumber: result.documentNumber ?? null,
      easybillSyncedAt: new Date(),
      easybillSyncError: null,
    },
  });

  console.info("EASYBILL_INVOICE_CREATED", {
    sessionId,
    documentId: result.documentId,
    documentNumber: result.documentNumber,
    customerId: result.customerId,
  });
}

async function handleCheckoutSession(cs: any) {
  const { reference, productIds, plan, metadataPriceCents, cartId } =
    parseCheckoutSession(cs);
  const primaryProductId = productIds[0];

  console.info("STRIPE_CHECKOUT_SESSION_COMPLETED", {
    sessionId: cs.id,
    productIds,
    plan,
  });

  const orders = await prisma.order.findMany({
    where: { stripeSessionId: cs.id },
  });

  const isPrecheckPlan =
    plan === "PRECHECK_FEE" || plan === "PRECHECK_PRIORITY";

  if (orders.length) {
    const now = new Date();
    const stripeSubId =
      typeof cs.subscription === "string" ? (cs.subscription as string) : null;
    const orderProductIds = orders.map((order) => order.productId);
    const paidProductIds = [...new Set([...productIds, ...orderProductIds])];
    const missingPrecheckProductIds = isPrecheckPlan
      ? productIds.filter((id) => !orderProductIds.includes(id))
      : [];

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

      await tx.order.updateMany({
        where: { stripeSessionId: cs.id },
        data: { paidAt: now, stripeSubId },
      });

      await tx.product.updateMany({
        where: { id: { in: paidProductIds } },
        data: { status: "PAID", paymentStatus: "PAID" },
      });
    });

    const VALID_LICENSE_PLANS: Plan[] = ["BASIC", "PREMIUM", "LIFETIME"];
    const priceIdMap: Record<string, string | undefined> = {
      BASIC: process.env.STRIPE_PRICE_BASIC,
      PREMIUM: process.env.STRIPE_PRICE_PREMIUM,
      LIFETIME: process.env.STRIPE_PRICE_LIFETIME,
    };

    const refreshedOrders = await enrichOrdersFromStripeSession(cs.id);

    const licenseOrders = refreshedOrders.filter((order) =>
      VALID_LICENSE_PLANS.includes(order.plan as Plan)
    );

    for (const order of licenseOrders) {
      const licensePlan = order.plan as Plan;
      const expiresAt =
        licensePlan === "LIFETIME"
          ? null
          : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      const stripePriceId =
        order.stripePriceId ?? priceIdMap[licensePlan] ?? undefined;
      const existingLicense = await prisma.license.findUnique({
        where: { productId: order.productId },
      });
      const startsAtForUpdate = existingLicense?.startsAt ?? now;

      await prisma.license.upsert({
        where: { productId: order.productId },
        update: {
          plan: licensePlan,
          status: "ACTIVE",
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
          status: "ACTIVE",
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
      const planFromOrder = refreshedOrders[0]?.plan;
      const planMismatch =
        plan &&
        planFromOrder &&
        VALID_LICENSE_PLANS.includes(planFromReference) &&
        planFromReference !== planFromOrder;

      if (planMismatch) {
        console.error("WEBHOOK_PLAN_MISMATCH", {
          planFromReference,
          planFromOrder,
          reference,
        });
      }
    }

    if (cartId) {
      await prisma.licenseCartItem.deleteMany({
        where: { cartId },
      });
    }

    try {
      await syncEasybillForSession({
        sessionId: cs.id,
        productIds,
      });
    } catch (err: any) {
      await prisma.order.updateMany({
        where: { stripeSessionId: cs.id },
        data: {
          easybillSyncError: err?.message ?? "Unknown Easybill sync error",
        },
      });

      console.error("EASYBILL_INVOICE_ERROR", err);
    }
  } else {
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

        try {
          const refreshedOrders = await enrichOrdersFromStripeSession(cs.id);

          if (refreshedOrders.length) {
            await syncEasybillForSession({
              sessionId: cs.id,
              productIds,
            });
          }
        } catch (err: any) {
          await prisma.order.updateMany({
            where: { stripeSessionId: cs.id },
            data: {
              easybillSyncError: err?.message ?? "Unknown Easybill sync error",
            },
          });

          console.error("EASYBILL_INVOICE_ERROR", err);
        }
      }
    }
  }

  if (plan === "PRECHECK_FEE" || plan === "PRECHECK_PRIORITY") {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { user: true },
    });

    let receiptPdf: Buffer | undefined;

    if (typeof (cs as any).invoice === "string") {
      try {
        const invoice = await stripe.invoices.retrieve(
          (cs as any).invoice as string
        );
        const pdfUrl = (invoice as any).invoice_pdf as
          | string
          | null
          | undefined;

        if (pdfUrl) {
          const res = await fetch(pdfUrl);
          if (res.ok) {
            const arr = await res.arrayBuffer();
            receiptPdf = Buffer.from(arr);
          }
        }
      } catch (err) {
        console.warn("INVOICE_PDF_FETCH_FAIL", err);
      }
    }

    const recipient = products.find((product) => product.user)?.user;
    const productNames = products.map((product) => product.name);

    if (!recipient) return;

    try {
      const mainProductId = primaryProductId ?? products[0]?.id;
      const processNumber = mainProductId
        ? await ensureProcessNumber(mainProductId)
        : await ensureProcessNumber(products[0].id);

      await sendPrecheckPaymentSuccess({
        to: recipient.email,
        name: recipient.name,
        gender: recipient.gender ?? undefined,
        productNames,
        processNumber,
        receiptPdf,
      });
    } catch (err) {
      console.error("PRECHECK_PAYMENT_EMAIL_ERROR", err);
    }
  }
}

export async function POST(req: Request) {
  const buf = Buffer.from(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature")!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    await handleCheckoutSession(event.data.object as any).catch((err) => {
      console.error(
        "WEBHOOK_CHECKOUT_HANDLER_ERROR",
        err,
        (err as any)?.payload ? { payload: (err as any).payload } : undefined
      );
      throw err;
    });
  }

  return NextResponse.json({ received: true });
}
