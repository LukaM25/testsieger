import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { AdminRole } from '@prisma/client';
import { requireAdmin, logAdminAudit } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const ROLE_VALUES = Object.values(AdminRole);

function normalizeEmail(email: unknown) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export async function GET() {
  const admin = await requireAdmin(AdminRole.SUPERADMIN).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      revokedAt: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ admins });
}

export async function POST(req: Request) {
  const admin = await requireAdmin(AdminRole.SUPERADMIN).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const role = typeof body.role === 'string' ? (body.role.trim().toUpperCase() as AdminRole) : AdminRole.EDITOR;

  if (!email || !name || !password) {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
  }
  if (!ROLE_VALUES.includes(role)) {
    return NextResponse.json({ error: 'INVALID_ROLE' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'WEAK_PASSWORD' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const created = await prisma.admin.create({
      data: {
        email,
        name,
        passwordHash,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        revokedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await logAdminAudit({
      adminId: admin.id,
      action: 'ADMIN_CREATE',
      entityType: 'Admin',
      entityId: created.id,
      payload: { email: created.email, role: created.role },
    });

    return NextResponse.json({ ok: true, admin: created });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'EMAIL_EXISTS' }, { status: 409 });
    }
    console.error('ADMIN_CREATE_ERROR', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
