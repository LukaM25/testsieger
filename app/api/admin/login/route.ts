import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { AdminRole } from '@prisma/client';
import { setAdminSession } from '@/lib/admin';
import { clearSession } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({} as any));
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const normalizedPassword = typeof password === 'string' ? password : '';

  if (!normalizedEmail || !normalizedPassword) {
    return NextResponse.json({ ok: false, error: 'MISSING_CREDENTIALS' }, { status: 400 });
  }

  let admin;
  try {
    admin = await prisma.admin.findUnique({ where: { email: normalizedEmail } });
  } catch (error) {
    console.error('Admin login database error', error);
    return NextResponse.json({ ok: false, error: 'DATABASE_UNAVAILABLE' }, { status: 503 });
  }
  const unauthorizedResponse = NextResponse.json({ ok: false, error: 'INVALID_CREDENTIALS' }, { status: 401 });

  if (!admin || !admin.active || admin.revokedAt) {
    return unauthorizedResponse;
  }

  const passwordOk = await bcrypt.compare(normalizedPassword, admin.passwordHash).catch(() => false);
  if (!passwordOk) {
    return unauthorizedResponse;
  }

  // Ensure any regular user session is cleared before elevating to admin.
  await clearSession();
  await setAdminSession({ id: admin.id, email: admin.email, role: admin.role as AdminRole });
  try {
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });
  } catch (error) {
    console.error('Admin login lastLoginAt update failed', error);
  }

  return NextResponse.json({
    ok: true,
    admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
  });
}
