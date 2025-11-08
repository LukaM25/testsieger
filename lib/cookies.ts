// lib/cookies.ts
// No need for 'use server' here; these are just server-only helpers.
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'tc_session';
const SECRET = process.env.JWT_SECRET!;
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function setSession(payload: { userId: string; email: string }) {
  if (!SECRET) throw new Error('Missing JWT_SECRET in env');
  const token = jwt.sign(payload, SECRET, { expiresIn: MAX_AGE });

  const jar = await cookies(); // <-- await because cookies() is async in your version
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function getSession(p0?: { userId: string; email: string; name: string; }): Promise<{ userId: string; email: string } | null> {
  if (!SECRET) throw new Error('Missing JWT_SECRET in env');

  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, SECRET) as any;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
}
