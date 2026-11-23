import { NextRequest, NextResponse } from 'next/server';
import { arbeitssicherheitEnabled } from '@/lib/arbeitssicherheit/gate';
import { BASE_POINT } from '@/lib/arbeitssicherheit/pricing';

export const dynamic = 'force-dynamic';

type Result = { km: number; place: string; method: 'route' | 'luftlinie' };
const cache = new Map<string, Result>();
const hits = new Map<string, { n: number; t: number }>();
const UA = 'DPI-Siegel/1.0 (info@dpi-siegel.de)';

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

async function getJson(url: string, ms = 6000) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(ms), cache: 'no-store' });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

export async function GET(req: NextRequest) {
  if (!arbeitssicherheitEnabled()) return NextResponse.json({ error: 'Nicht verfügbar.' }, { status: 404 });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const now = Date.now();
  const h = hits.get(ip);
  if (h && now - h.t < 60_000) {
    if (h.n >= 20) return NextResponse.json({ error: 'Zu viele Anfragen, bitte kurz warten.' }, { status: 429 });
    h.n += 1;
  } else hits.set(ip, { n: 1, t: now });

  const plz = (req.nextUrl.searchParams.get('plz') || '').trim();
  if (!/^\d{5}$/.test(plz)) return NextResponse.json({ error: 'Bitte eine 5-stellige Postleitzahl eingeben.' }, { status: 400 });
  const cached = cache.get(plz);
  if (cached) return NextResponse.json(cached);

  try {
    const geo = await getJson(`https://nominatim.openstreetmap.org/search?postalcode=${plz}&country=Germany&format=json&limit=1&addressdetails=1`);
    const hit = geo?.[0];
    if (!hit) return NextResponse.json({ error: 'Diese Postleitzahl haben wir nicht gefunden.' }, { status: 404 });
    const dest = { lat: Number(hit.lat), lon: Number(hit.lon) };
    const a = hit.address || {};
    const place = String(a.city || a.town || a.village || a.municipality || a.county || plz);

    let km: number;
    let method: Result['method'] = 'route';
    try {
      const r = await getJson(`https://router.project-osrm.org/route/v1/driving/${BASE_POINT.lon},${BASE_POINT.lat};${dest.lon},${dest.lat}?overview=false`);
      const m = r?.routes?.[0]?.distance;
      if (typeof m !== 'number') throw new Error('no route');
      km = m / 1000;
    } catch {
      km = haversineKm(BASE_POINT, dest) * 1.3;
      method = 'luftlinie';
    }
    const result: Result = { km: Math.round(km), place, method };
    cache.set(plz, result);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Die Entfernung konnte gerade nicht berechnet werden. Bitte später erneut versuchen.' }, { status: 502 });
  }
}
