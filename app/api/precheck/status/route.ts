import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';

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
      })
    : await prisma.product.findFirst({
        where: { userId: session.userId },
        orderBy: { createdAt: 'desc' },
      });

  if (!product) return NextResponse.json({ ok: true, product: null });

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
  });
}
