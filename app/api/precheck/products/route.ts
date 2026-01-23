import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { userId: session.userId },
    select: {
      id: true,
      name: true,
      brand: true,
      status: true,
      adminProgress: true,
      paymentStatus: true,
      createdAt: true,
      certificate: {
        select: { id: true, status: true },
      },
      license: { select: { status: true, plan: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const productIds = products.map((product) => product.id);
  const paidAtByProductId: Record<string, Date> = {};
  if (productIds.length) {
    const paidOrders = await prisma.order.findMany({
      where: { productId: { in: productIds }, paidAt: { not: null } },
      select: { productId: true, paidAt: true },
      orderBy: { paidAt: 'desc' },
    });
    paidOrders.forEach((order) => {
      if (!order.paidAt) return;
      if (!paidAtByProductId[order.productId]) {
        paidAtByProductId[order.productId] = order.paidAt;
      }
    });
  }

  const payload = products.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    status: p.status,
    adminProgress: p.adminProgress,
    paymentStatus: p.paymentStatus,
    createdAt: p.createdAt,
    paidAt: paidAtByProductId[p.id] ?? null,
    precheckDiscountPercent: 0,
    certificate: p.certificate
      ? {
          id: p.certificate.id,
          status: p.certificate.status ?? null,
          pdfUrl: null,
          reportUrl: null,
          qrUrl: null,
          sealUrl: null,
        }
      : null,
    license: p.license
      ? {
          status: p.license.status,
          plan: p.license.plan,
        }
      : null,
  }));

  return NextResponse.json({
    ok: true,
    products: payload,
  });
}
