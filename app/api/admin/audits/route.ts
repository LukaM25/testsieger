import { NextResponse } from 'next/server';
import { AdminRole } from '@prisma/client';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const admin = await requireAdmin(AdminRole.SUPERADMIN).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const adminId = searchParams.get('adminId') || undefined;
  const productId = searchParams.get('productId') || undefined;
  const action = searchParams.get('action') || undefined;
  const limitParam = parseInt(searchParams.get('limit') || '50', 10);
  const limit = Math.min(Math.max(limitParam || 50, 1), 200);

  const audits = await prisma.adminAudit.findMany({
    where: {
      adminId,
      productId,
      action: action ? action : undefined,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      admin: { select: { id: true, name: true, email: true } },
      product: { select: { id: true, name: true, brand: true } },
    },
  });

  return NextResponse.json({ audits });
}
