import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { clearSession, setSession } from '@/lib/cookies';

export const runtime = 'nodejs';

const UpdateSchema = z.object({
  email: z.string().email(),
  street: z.string().optional().nullable(),
  houseNumber: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  currentPassword: z.string().optional().nullable(),
  newPassword: z.string().optional().nullable(),
  confirmPassword: z.string().optional().nullable(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, address: true },
  });
  if (!user) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  return NextResponse.json({ ok: true, user });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  let input: z.infer<typeof UpdateSchema>;
  try {
    input = UpdateSchema.parse(await req.json());
  } catch (err: any) {
    if (err?.issues) return NextResponse.json({ error: 'INVALID_INPUT', issues: err.issues }, { status: 400 });
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedStreet = input.street ? input.street.trim() : '';
  const normalizedHouseNumber = input.houseNumber ? input.houseNumber.trim() : '';
  const normalizedPostalCode = input.postalCode ? input.postalCode.trim() : '';
  const normalizedCity = input.city ? input.city.trim() : '';
  const streetLine = [normalizedStreet, normalizedHouseNumber].filter(Boolean).join(' ').trim();
  const cityLine = [normalizedPostalCode, normalizedCity].filter(Boolean).join(' ').trim();
  const combinedAddress = [streetLine, cityLine].filter(Boolean).join(', ');

  const current = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, active: true, deletedAt: true, passwordHash: true },
  });
  if (!current || current.active === false || current.deletedAt) {
    await clearSession();
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (normalizedEmail !== current.email) {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing && existing.id !== session.userId) {
      return NextResponse.json({ error: 'EMAIL_EXISTS' }, { status: 409 });
    }
  }

  const wantsPasswordChange =
    Boolean(input.currentPassword || input.newPassword || input.confirmPassword);
  if (wantsPasswordChange) {
    if (!input.currentPassword || !input.newPassword || !input.confirmPassword) {
      return NextResponse.json({ error: 'PASSWORD_FIELDS_REQUIRED' }, { status: 400 });
    }
    if (input.newPassword.length < 8) {
      return NextResponse.json({ error: 'WEAK_PASSWORD' }, { status: 400 });
    }
    if (input.newPassword !== input.confirmPassword) {
      return NextResponse.json({ error: 'PASSWORD_MISMATCH' }, { status: 400 });
    }
    const matches = await bcrypt.compare(input.currentPassword, current.passwordHash);
    if (!matches) {
      return NextResponse.json({ error: 'INVALID_PASSWORD' }, { status: 400 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data: {
      email: normalizedEmail,
      address: combinedAddress || null,
      ...(wantsPasswordChange ? { passwordHash: await bcrypt.hash(input.newPassword!, 10) } : {}),
    },
    select: { email: true, address: true },
  });

  if (normalizedEmail !== current.email) {
    await setSession({ userId: session.userId, email: normalizedEmail });
  }

  return NextResponse.json({ ok: true, user: updated });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, active: true, deletedAt: true },
  });
  if (!user || user.active === false || user.deletedAt) {
    await clearSession();
    return NextResponse.json({ ok: true });
  }

  const anonymizedEmail = `deleted+${user.id}@deleted.local`;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      active: false,
      deletedAt: new Date(),
      email: anonymizedEmail,
    },
  });

  await clearSession();
  return NextResponse.json({ ok: true });
}
