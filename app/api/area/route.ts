import { NextRequest, NextResponse } from 'next/server';
import { arbeitssicherheitEnabled } from '@/lib/arbeitssicherheit/gate';

export const dynamic = 'force-dynamic';

/** Setzt (oder löscht) die Bereichswahl der Seite und leitet weiter. */
export function GET(req: NextRequest) {
  const set = req.nextUrl.searchParams.get('set');
  const res = NextResponse.redirect(new URL(set === 'arbeitssicherheit' && arbeitssicherheitEnabled() ? '/arbeitssicherheit' : set === 'produkttest' ? '/' : '/', req.url));
  if (set === 'arbeitssicherheit' && arbeitssicherheitEnabled()) {
    res.cookies.set('dpi_area', 'arbeitssicherheit', { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  } else if (set === 'produkttest') {
    res.cookies.set('dpi_area', 'produkttest', { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  } else {
    res.cookies.set('dpi_area', '', { path: '/', maxAge: 0 });
  }
  return res;
}
