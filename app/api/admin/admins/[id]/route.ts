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

async function ensureAnotherSuperadmin(excludeId: string) {
  const count = await prisma.admin.count({
    where: {
      id: { not: excludeId },
      role: AdminRole.SUPERADMIN,
      active: true,
      revokedAt: null,
    },
  });
  return count > 0;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const superadmin = await requireAdmin(AdminRole.SUPERADMIN).catch(() => null);
  if (!superadmin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const updates: any = {};
  const roleRaw = typeof body.role === 'string' ? body.role.trim().toUpperCase() : null;
  const name = typeof body.name === 'string' ? body.name.trim() : null;
  const active = typeof body.active === 'boolean' ? body.active : null;
  const password = typeof body.password === 'string' ? body.password : null;
  const email = normalizeEmail(body.email);

  if (name) updates.name = name;
  if (email) updates.email = email;

  if (roleRaw) {
    if (!ROLE_VALUES.includes(roleRaw as AdminRole)) {
      return NextResponse.json({ error: 'INVALID_ROLE' }, { status: 400 });
    }
    updates.role = roleRaw as AdminRole;
  }

  if (active !== null) {
    updates.active = active;
    if (!active) {
      updates.revokedAt = new Date();
    } else {
      updates.revokedAt = null;
    }
  }

  if (password !== null) {
    if (password.length < 8) {
      return NextResponse.json({ error: 'WEAK_PASSWORD' }, { status: 400 });
    }
    updates.passwordHash = await bcrypt.hash(password, 12);
  }

  const target = await prisma.admin.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  // Prevent removing the last active superadmin
  const demotingOrDeactivatingSuper =
    target.role === AdminRole.SUPERADMIN &&
    ((updates.role && updates.role !== AdminRole.SUPERADMIN) || updates.active === false);

  if (demotingOrDeactivatingSuper) {
    const hasAnother = await ensureAnotherSuperadmin(target.id);
    if (!hasAnother) {
      return NextResponse.json({ error: 'LAST_SUPERADMIN' }, { status: 400 });
    }
  }

  try {
    const updated = await prisma.admin.update({
      where: { id },
      data: updates,
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
      adminId: superadmin.id,
      action: 'ADMIN_UPDATE',
      entityType: 'Admin',
      entityId: updated.id,
      payload: {
        role: updates.role ?? target.role,
        active: updates.active ?? target.active,
        changedEmail: Boolean(email),
        changedPassword: Boolean(password),
      },
    });

    return NextResponse.json({ ok: true, admin: updated });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'EMAIL_EXISTS' }, { status: 409 });
    }
    console.error('ADMIN_UPDATE_ERROR', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
