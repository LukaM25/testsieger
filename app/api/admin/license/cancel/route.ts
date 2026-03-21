import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { AdminRole } from "@prisma/client";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(AdminRole.EXAMINER).catch(() => null);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { productId } = await req.json();

  const license = await prisma.license.findFirst({
    where: { productId, status: "ACTIVE" },
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
