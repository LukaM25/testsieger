import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { getPublicBaseUrl } from "@/lib/baseUrl";
import { Plan } from "@prisma/client";
import {
  LICENSE_PLAN_SET,
  discountPercentForOrderIndex,
  getPlanPriceCentsMap,
} from "@/lib/licensePricing";

export const runtime = "nodejs";

const isPaidStatus = (status: string | null | undefined) => status === "PAID" || status === "MANUAL";

function buildOrderIndexMap(products: Array<{ id: string; createdAt: Date }>) {
  const sorted = [...products].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const map = new Map<string, number>();
  sorted.forEach((p, index) => {
    map.set(p.id, index + 1);
  });
  return map;
}

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const cart = await prisma.licenseCart.findUnique({
    where: { userId: session.userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              createdAt: true,
              paymentStatus: true,
              adminProgress: true,
              license: { select: { status: true } },
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "CART_EMPTY" }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where: { userId: session.userId },
    select: { id: true, createdAt: true },
  });
  const orderIndexMap = buildOrderIndexMap(products);

  const invalid = cart.items.find((item) => {
    const paid = isPaidStatus(item.product.paymentStatus);
    const hasPassed = item.product.adminProgress === "PASS";
    const licenseActive = item.product.license?.status === "ACTIVE";
    return !paid || !hasPassed || licenseActive;
  });
  if (invalid) {
    return NextResponse.json({ error: "CART_ITEM_INVALID", productId: invalid.productId }, { status: 409 });
  }

  const planList = cart.items
    .map((item) => item.plan)
    .filter((plan) => LICENSE_PLAN_SET.has(plan));
  const priceMap = await getPlanPriceCentsMap(planList as Plan[]);

  const lineItems = cart.items.map((item) => {
    const orderIndex = orderIndexMap.get(item.productId) ?? 1;
    const discountPercent = discountPercentForOrderIndex(orderIndex);
    const basePriceCents = priceMap[item.plan as Plan] ?? 0;
    const unitAmount = Math.round(basePriceCents * (1 - discountPercent / 100));
    const planLabel =
      item.plan === "BASIC" ? "Lizenz Basic" : item.plan === "PREMIUM" ? "Lizenz Premium" : "Lizenz Lifetime";
    return {
      price_data: {
        currency: "eur",
        unit_amount: unitAmount,
        product_data: {
          name: `${planLabel} – ${item.product.name}`,
        },
      },
      quantity: 1,
    };
  });

  const baseUrl = getPublicBaseUrl();
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: session.email,
    client_reference_id: `${session.userId}:license-cart:${cart.id}`,
    metadata: {
      userId: session.userId,
      cartId: cart.id,
      productIds: JSON.stringify(cart.items.map((item) => item.productId)),
    },
    line_items: lineItems,
    success_url: `${baseUrl}/dashboard?licenseCheckout=success`,
    cancel_url: `${baseUrl}/dashboard?licenseCheckout=cancel`,
  });

  await prisma.order.createMany({
    data: cart.items.map((item) => {
      const orderIndex = orderIndexMap.get(item.productId) ?? 1;
      const discountPercent = discountPercentForOrderIndex(orderIndex);
      const basePriceCents = priceMap[item.plan as Plan] ?? 0;
      const priceCents = Math.round(basePriceCents * (1 - discountPercent / 100));
      return {
        userId: session.userId,
        productId: item.productId,
        plan: item.plan,
        priceCents,
        stripeSessionId: checkout.id,
      };
    }),
  });

  return NextResponse.json({ ok: true, url: checkout.url });
}
