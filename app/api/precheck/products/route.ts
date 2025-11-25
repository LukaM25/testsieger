import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { userId: session.userId },
    include: {
      certificate: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    ok: true,
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      status: p.status,
      adminProgress: p.adminProgress,
      paymentStatus: p.paymentStatus,
      createdAt: p.createdAt,
      certificate: p.certificate
        ? {
            id: p.certificate.id,
            pdfUrl: p.certificate.pdfUrl,
          }
        : null,
    })),
  });
}
