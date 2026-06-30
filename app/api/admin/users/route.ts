import { AdminRole } from '@prisma/client';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const admin = await requireAdmin(AdminRole.SUPERADMIN).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const email = (searchParams.get('email') || '').trim();
  if (email.length < 3) {
    return NextResponse.json({ error: 'EMAIL_QUERY_REQUIRED' }, { status: 400 });
  }

  const users = await prisma.user.findMany({
    where: {
      email: { contains: email, mode: 'insensitive' },
    },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      active: true,
      deletedAt: true,
      _count: { select: { products: true } },
    },
    orderBy: { email: 'asc' },
    take: 10,
  });

  return NextResponse.json({
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      company: user.company,
      active: user.active && !user.deletedAt,
      productCount: user._count.products,
    })),
  });
}
