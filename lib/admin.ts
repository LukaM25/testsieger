import { cookies } from 'next/headers';

const ADMIN_COOKIE = 'admin_session';
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 365 * 10; // 10 years

export async function setAdminSession() {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0 });
}

export async function isAdminAuthed() {
  const jar = await cookies();
  return jar.get(ADMIN_COOKIE)?.value === '1';
}

export async function requireAdmin() {
  const ok = await isAdminAuthed();
  if (!ok) throw new Error('UNAUTHORIZED_ADMIN');
}
