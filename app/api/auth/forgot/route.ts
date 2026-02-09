import { NextResponse } from 'next/server';
import { createResetToken } from '@/lib/passwordReset';
import { sendPasswordResetEmail } from '@/lib/email';
import { getPublicBaseUrl } from '@/lib/baseUrl';

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!normalizedEmail) return NextResponse.json({ ok: true });

  const result = await createResetToken(normalizedEmail);
  if (result) {
    const baseUrl = getPublicBaseUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(result.token)}`;
    await sendPasswordResetEmail({
      to: normalizedEmail,
      name: result.user.name,
      gender: result.user.gender ?? undefined,
      resetUrl,
    }).catch(() => {
      /* avoid blocking on email failure */
    });
  }

  return NextResponse.json({ ok: true });
}
