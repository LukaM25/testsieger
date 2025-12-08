import { NextResponse } from 'next/server';
import { logAdminAudit, requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: 'MISSING_PRODUCT_ID' }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: 'PRODUCT_NOT_FOUND' }, { status: 404 });

  if (product.status !== 'PAID' && product.status !== 'IN_REVIEW') {
    return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 400 });
  }

  await prisma.product.update({
    where: { id: product.id },
    data: { status: 'IN_REVIEW' },
  });

  await logAdminAudit({
    adminId: admin.id,
    action: 'PRODUCT_RECEIVE',
    entityType: 'Product',
    entityId: product.id,
    productId: product.id,
    payload: { previousStatus: product.status },
  });

  return NextResponse.json({ ok: true, message: 'Produktstatus auf IN_REVIEW gesetzt.' });
}
