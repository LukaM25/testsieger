import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",  // ← fix was here
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

  const license = await prisma.license.findFirst({
    where: {
      productId,
      product: { userId: session.userId },
      status: "ACTIVE",
    },
  });

  if (!license) return NextResponse.json({ error: "License not found" }, { status: 404 });

  if (license.stripeSubId && license.plan !== "LIFETIME") {
    await stripe.subscriptions.cancel(license.stripeSubId);
  }

  await prisma.license.update({
    where: { id: license.id },
    data: { status: "CANCELED", expiresAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
