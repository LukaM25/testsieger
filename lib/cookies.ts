// lib/cookies.ts
// No need for 'use server' here; these are just server-only helpers.
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, sessionCookieOptions } from './session';

const SECRET = process.env.JWT_SECRET!;
// Session lifetime: 10 minutes (rolling on activity)
const MAX_AGE = SESSION_MAX_AGE_SECONDS;

export async function setSession(payload: { userId: string; email: string }) {
  if (!SECRET) throw new Error('Missing JWT_SECRET in env');
  const token = jwt.sign(payload, SECRET, { expiresIn: MAX_AGE });

  const jar = await cookies(); // <-- await because cookies() is async in your version
  jar.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
}

export async function getSession(p0?: { userId: string; email: string; name: string; }): Promise<{ userId: string; email: string } | null> {
  if (!SECRET) throw new Error('Missing JWT_SECRET in env');

  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, SECRET) as any;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
}
