import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Plan } from "@prisma/client";
import {
  LICENSE_PLAN_SET,
  computeDiscountedPlanPriceCents,
  getPlanPriceCentsMap,
  normalizeLicensePlan,
} from "@/lib/licensePricing";

export const runtime = "nodejs";

const isPaidStatus = (status: string | null | undefined) => status === "PAID" || status === "MANUAL";

const discountPercentForCount = (count: number) => (count <= 1 ? 0 : count === 2 ? 20 : 30);

async function loadCartState(userId: string) {
  const cart = await prisma.licenseCart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              brand: true,
              createdAt: true,
              paymentStatus: true,
              adminProgress: true,
              license: { select: { status: true, plan: true } },
            },
          },
        },
      },
    },
  });

  const cartItemCount = cart?.items.length ?? 0;
  const cartDiscountPercent = discountPercentForCount(cartItemCount);
  const planList = (cart?.items || [])
    .map((item) => item.plan)
    .filter((plan) => LICENSE_PLAN_SET.has(plan));
  const priceMap = await getPlanPriceCentsMap(planList as Plan[]);

  const items = (cart?.items || []).map((item) => {
    const plan = item.plan as Plan;
    const basePriceCents = priceMap[plan] ?? 0;
    const finalPriceCents = computeDiscountedPlanPriceCents(plan, basePriceCents, cartDiscountPercent);
    const savingsCents = Math.max(basePriceCents - finalPriceCents, 0);
    const paid = isPaidStatus(item.product.paymentStatus);
    const hasPassed = item.product.adminProgress === "PASS";
    const licenseActive = item.product.license?.status === "ACTIVE";
    const eligible = paid && hasPassed && !licenseActive;
    let reason = "";
    if (!paid) reason = "GRUNDGEBUEHR_OFFEN";
    else if (!hasPassed) reason = "PRUEFUNG_OFFEN";
    else if (licenseActive) reason = "LIZENZ_AKTIV";
    return {
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productBrand: item.product.brand,
      plan: item.plan,
      basePriceCents,
      discountPercent: cartDiscountPercent,
      finalPriceCents,
      savingsCents,
      eligible,
      reason,
    };
  });

  const totals = items.reduce(
    (acc, item) => {
      if (!item.eligible) return acc;
      acc.baseCents += item.basePriceCents;
      acc.savingsCents += item.savingsCents;
      acc.totalCents += item.finalPriceCents;
      acc.itemCount += 1;
      return acc;
    },
    { baseCents: 0, savingsCents: 0, totalCents: 0, itemCount: 0 }
  );

  return {
    cartId: cart?.id || null,
    items,
    totals,
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const data = await loadCartState(session.userId);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const productId = typeof body.productId === "string" ? body.productId : "";
  const plan = normalizeLicensePlan(body.plan);
  if (!productId || !plan) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      userId: true,
      paymentStatus: true,
      adminProgress: true,
      license: { select: { status: true } },
    },
  });
  if (!product || product.userId !== session.userId) {
    return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 });
  }
  if (!isPaidStatus(product.paymentStatus)) {
    return NextResponse.json({ error: "BASE_FEE_REQUIRED" }, { status: 409 });
  }
  if (product.adminProgress !== "PASS") {
    return NextResponse.json({ error: "NOT_PASSED" }, { status: 409 });
  }
  if (product.license?.status === "ACTIVE") {
    return NextResponse.json({ error: "LICENSE_ACTIVE" }, { status: 409 });
  }

  await prisma.licenseCart.createMany({
    data: [{ userId: session.userId }],
    skipDuplicates: true,
  });

  const cart = await prisma.licenseCart.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!cart) {
    return NextResponse.json({ error: "CART_CREATE_FAILED" }, { status: 500 });
  }

  await prisma.licenseCartItem.createMany({
    data: [{ cartId: cart.id, productId, plan }],
    skipDuplicates: true,
  });

  await prisma.licenseCartItem.updateMany({
    where: { cartId: cart.id, productId },
    data: { plan },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const productId = typeof body.productId === "string" ? body.productId : "";
  if (!productId) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const cart = await prisma.licenseCart.findUnique({ where: { userId: session.userId } });
  if (!cart) return NextResponse.json({ ok: true });

  await prisma.licenseCartItem.deleteMany({
    where: { cartId: cart.id, productId },
  });

  return NextResponse.json({ ok: true });
}
