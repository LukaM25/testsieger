
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { setSession } from "@/lib/cookies";
import { z } from "zod";

const RegistrationSchema = z.object({
  name: z.string().trim().min(2, "Name erforderlich"),
  email: z.string().trim().toLowerCase().email("Ungültige E‑Mail"),
  password: z.string().min(8, "Passwort min. 8 Zeichen"),
  address: z.string().trim().optional().default(""),
});

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') || '';
  let rawData: Record<string, unknown> = {};

  try {
    if (contentType.includes('application/json')) {
        rawData = await req.json();
    } else {
      const form = await req.formData();
      rawData = Object.fromEntries(
        Array.from(form.entries()).map(([key, value]) => {
          if (typeof value === 'string') return [key, value];
          if (value instanceof Blob && 'text' in value && typeof value.text === 'function') {
            // Avoid rejecting if a file sneaks in; treat as empty string to preserve flow.
            return [key, ''];
          }
          return [key, String(value ?? '')];
        }),
      );
    }
  } catch {
    return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 });
  }

  const parsed = RegistrationSchema.safeParse(rawData);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues?.[0]?.message ?? 'VALIDATION_FAILED' }, { status: 400 });
  }

  const data = parsed.data;
  const exists = await prisma.user.findFirst({ where: { email: { equals: data.email, mode: 'insensitive' } } });
  if (exists) return NextResponse.json({ error: 'E‑Mail bereits registriert' }, { status: 400 });

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, passwordHash, address: data.address },
  });
  await setSession({ userId: user.id, email: user.email });
  return NextResponse.json({ ok: true });
}
