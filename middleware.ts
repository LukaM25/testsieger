import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  adminSessionCookieOptions,
  sessionCookieOptions,
} from './lib/session';

const encoder = new TextEncoder();
const SKIP_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/register',
  '/api/auth/reset',
  '/api/auth/forgot',
  '/api/admin/login',
  '/api/admin/logout',
  '/api/precheck',
]);

export async function middleware(req: NextRequest) {
  if (SKIP_PATHS.has(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  let touched = false;

  const userToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const userSecret = process.env.JWT_SECRET;
  if (userToken && userSecret) {
    try {
      const { payload } = await jwtVerify(userToken, encoder.encode(userSecret));
      const userId = typeof payload.userId === 'string' ? payload.userId : null;
      const email = typeof payload.email === 'string' ? payload.email : null;
      const exp = typeof payload.exp === 'number' ? payload.exp : null;
      if (!userId || !email) throw new Error('INVALID_USER_PAYLOAD');

      const now = Math.floor(Date.now() / 1000);
      const secondsLeft = exp ? exp - now : 0;
      const refreshWindow = Math.min(SESSION_MAX_AGE_SECONDS / 2, 300); // refresh when <=5m or half-life
      if (!exp || secondsLeft <= refreshWindow) {
        const refreshed = await new SignJWT({ userId, email })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt(now)
          .setExpirationTime(now + SESSION_MAX_AGE_SECONDS)
          .sign(encoder.encode(userSecret));

        res.cookies.set(SESSION_COOKIE_NAME, refreshed, sessionCookieOptions());
        touched = true;
      }
    } catch {
      res.cookies.set(SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
      touched = true;
    }
  }

  const adminToken = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const adminSecret = process.env.ADMIN_JWT_SECRET;
  if (adminToken && adminSecret) {
    try {
      const { payload } = await jwtVerify(adminToken, encoder.encode(adminSecret));
      const adminId = typeof payload.adminId === 'string' ? payload.adminId : null;
      const email = typeof payload.email === 'string' ? payload.email : null;
      const role = typeof payload.role === 'string' ? payload.role : null;
      const exp = typeof payload.exp === 'number' ? payload.exp : null;
      if (!adminId || !email || !role) throw new Error('INVALID_ADMIN_PAYLOAD');

      const now = Math.floor(Date.now() / 1000);
      const secondsLeft = exp ? exp - now : 0;
      const refreshWindow = Math.min(ADMIN_SESSION_MAX_AGE_SECONDS / 2, 300);
      if (!exp || secondsLeft <= refreshWindow) {
        const refreshed = await new SignJWT({ adminId, email, role })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt(now)
          .setExpirationTime(now + ADMIN_SESSION_MAX_AGE_SECONDS)
          .sign(encoder.encode(adminSecret));

        res.cookies.set(ADMIN_SESSION_COOKIE_NAME, refreshed, adminSessionCookieOptions());
        touched = true;
      }
    } catch {
      res.cookies.set(ADMIN_SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
      touched = true;
    }
  }

  return touched ? res : NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
