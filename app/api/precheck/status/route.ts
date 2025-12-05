import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';
import { Plan } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });

  const url = new URL(req.url);
  const productId = url.searchParams.get('productId') || undefined;

  const product = productId
    ? await prisma.product.findFirst({
        where: { id: productId, userId: session.userId },
        select: {
          id: true,
          name: true,
          paymentStatus: true,
          adminProgress: true,
          status: true,
          createdAt: true,
        },
      })
    : await prisma.product.findFirst({
        where: { userId: session.userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          paymentStatus: true,
          adminProgress: true,
          status: true,
          createdAt: true,
        },
      });

  if (!product) return NextResponse.json({ ok: true, product: null, licensePaid: false });

  const paidLicense = await prisma.order.findFirst({
    where: {
      userId: session.userId,
      productId: product.id,
      paidAt: { not: null },
      plan: { in: [Plan.BASIC, Plan.PREMIUM, Plan.LIFETIME] },
    },
  });

  return NextResponse.json({
    ok: true,
    product: {
      id: product.id,
      name: product.name,
      paymentStatus: product.paymentStatus,
      adminProgress: product.adminProgress,
      status: product.status,
      createdAt: product.createdAt,
    },
    licensePaid: !!paidLicense,
  });
}
