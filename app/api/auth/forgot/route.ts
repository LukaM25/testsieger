import { NextResponse } from 'next/server';
import { createResetToken } from '@/lib/passwordReset';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!normalizedEmail) return NextResponse.json({ ok: true });

  const result = await createResetToken(normalizedEmail);
  if (result) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(result.token)}`;
    await sendPasswordResetEmail({
      to: normalizedEmail,
      name: result.user.name,
      resetUrl,
    }).catch(() => {
      /* avoid blocking on email failure */
    });
  }

  return NextResponse.json({ ok: true });
}
