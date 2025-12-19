export const SESSION_COOKIE_NAME = 'tc_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 10;
export const ADMIN_SESSION_COOKIE_NAME = 'admin_token';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 10;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  };
}
