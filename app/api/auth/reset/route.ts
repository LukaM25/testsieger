import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { consumeResetToken } from '@/lib/passwordReset';
import { prisma } from '@/lib/prisma';
import { setSession } from '@/lib/cookies';

export async function POST(req: Request) {
  const { token, password } = await req.json().catch(() => ({}));
  if (!token || !password) return NextResponse.json({ error: 'MISSING' }, { status: 400 });
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'WEAK_PASSWORD' }, { status: 400 });
  }

  const userId = await consumeResetToken(String(token));
  if (!userId) return NextResponse.json({ error: 'INVALID_OR_EXPIRED' }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
    select: { id: true, email: true, name: true },
  });

  await setSession({ userId: user.id, email: user.email });
  return NextResponse.json({ ok: true, redirect: '/dashboard' });
}
