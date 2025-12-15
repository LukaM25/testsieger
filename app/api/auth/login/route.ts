import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';

export async function POST(req: Request) {
  // Accept either FormData or JSON
  let email = '';
  let password = '';
  let redirectTo = '';

  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await req.json();
    email = String(body.email || '');
    password = String(body.password || '');
    redirectTo = String(body.redirectTo || '');
  } else {
    const form = await req.formData();
    email = String(form.get('email') || '');
    password = String(form.get('password') || '');
    redirectTo = String(form.get('redirectTo') || '');
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'MISSING_CREDENTIALS' }, { status: 400 });
  }

  try {
    await loginUser(email, password); // sets the cookie via setSession()
    const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '';
    return NextResponse.json({ ok: true, redirect: safeRedirect || '/dashboard' });
  } catch (e: any) {
    const code = e?.message || 'LOGIN_FAILED';
    const status =
      code === 'USER_NOT_FOUND' || code === 'INVALID_PASSWORD' ? 401 : 500;
    return NextResponse.json({ error: code }, { status });
  }
}
