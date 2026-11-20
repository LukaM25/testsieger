import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { setSession } from '@/lib/cookies';

export const runtime = 'nodejs';

const RegisterSchema = z.object({
  name: z.string().trim().min(2, 'NAME_REQUIRED').max(120),
  email: z.string().trim().toLowerCase().email('INVALID_EMAIL').max(200),
  password: z.string().min(8, 'WEAK_PASSWORD').max(200),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
  company: z.string().trim().max(160).optional().nullable(),
  street: z.string().trim().max(120).optional().nullable(),
  houseNumber: z.string().trim().max(20).optional().nullable(),
  postalCode: z.string().trim().max(12).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  redirectTo: z.string().optional().nullable(),
});

const MESSAGES: Record<string, string> = {
  NAME_REQUIRED: 'Bitte geben Sie Ihren Namen an.',
  INVALID_EMAIL: 'Bitte geben Sie eine gültige E-Mail-Adresse an.',
  WEAK_PASSWORD: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
};

export async function POST(req: Request) {
  // Accept JSON or FormData
  let raw: Record<string, unknown> = {};
  const contentType = req.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      raw = await req.json();
    } else {
      const form = await req.formData();
      raw = Object.fromEntries(form.entries());
    }
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  // Vor- und Nachname getrennt entgegennehmen, als "Vorname Nachname" speichern
  const clean = (v: unknown) => String(v ?? '').replace(/\s+/g, ' ').trim();
  if (raw.firstName !== undefined || raw.lastName !== undefined) {
    const first = clean(raw.firstName);
    const last = clean(raw.lastName);
    if (!first || !last) {
      return NextResponse.json({ error: 'Bitte geben Sie Vor- und Nachnamen an.' }, { status: 400 });
    }
    raw = { ...raw, name: `${first} ${last}` };
  } else if (raw.name !== undefined) {
    raw = { ...raw, name: clean(raw.name) };
  }

  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) {
    const code = parsed.error.issues[0]?.message || '';
    return NextResponse.json({ error: MESSAGES[code] || 'Bitte prüfen Sie Ihre Eingaben.' }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { email: { equals: data.email, mode: 'insensitive' } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'Diese E-Mail ist bereits registriert. Bitte melden Sie sich an oder setzen Sie Ihr Passwort zurück.' },
      { status: 409 },
    );
  }

  // Same address format as the account page: "Straße Nr, PLZ Ort"
  const streetLine = [data.street, data.houseNumber].filter(Boolean).join(' ').trim();
  const cityLine = [data.postalCode, data.city].filter(Boolean).join(' ').trim();
  const address = [streetLine, cityLine].filter(Boolean).join(', ');

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      gender: data.gender || null,
      company: data.company || null,
      address: address || null,
    },
  });

  await setSession({ userId: user.id, email: user.email });
  const redirectTo = typeof data.redirectTo === 'string' && data.redirectTo.startsWith('/') && !data.redirectTo.startsWith('//')
    ? data.redirectTo
    : '/dashboard';
  return NextResponse.json({ ok: true, redirect: redirectTo });
}
