// app/api/precheck/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { setSession } from '@/lib/cookies';
import { sendPrecheckConfirmation } from '@/lib/email';
import { getSession } from '@/lib/auth';

const PrecheckSchema = z.object({
  name: z.string().trim().min(2),
  company: z.string().trim().min(2),
  email: z.string().trim().email(),
  address: z.string().min(5),
  password: z.string().min(8, 'Passwort min. 8 Zeichen'),
  // product
  productName: z.string().trim().min(2),
  brand: z.string().trim().min(1),
  category: z.string().trim().min(1),
  code: z.string().trim().min(2),
  specs: z.string().trim().min(5),
  size: z.string().trim().min(2),
  madeIn: z.string().trim().min(2),
  material: z.string().trim().min(2),
  privacyAccepted: z.literal(true),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = PrecheckSchema.parse(json);
    const category = data.category.trim();
    const normalizedEmail = data.email.trim().toLowerCase();
    const session = await getSession();

    // 1) Ensure user exists (or create)
    const existing = await prisma.user.findFirst({ where: { email: { equals: normalizedEmail, mode: 'insensitive' } } });

    if (existing && (!session || session.userId !== existing.id)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'LOGIN_REQUIRED',
          redirect: `/login?email=${encodeURIComponent(normalizedEmail)}`,
          message: 'Account existiert bereits. Bitte einloggen.',
        },
        { status: 409 }
      );
    }

    let userId: string;
    if (!existing) {
      const passwordHash = await bcrypt.hash(data.password, 12);
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: normalizedEmail,
          passwordHash,
          address: data.address,
          company: data.company ?? undefined,
        },
        select: { id: true, email: true },
      });
      userId = user.id;
    } else {
      // If user exists but has no password (older data), set it; update address/name for freshness
      let passwordHash = existing.passwordHash;
      if (!passwordHash && data.password) {
        passwordHash = await bcrypt.hash(data.password, 12);
      }
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: data.name ?? existing.name,
          address: data.address ?? existing.address,
          company: data.company ?? existing.company ?? undefined,
          passwordHash,
        },
        select: { id: true, email: true },
      });
      userId = updated.id;
    }

    // 2) Create Product in PRECHECK
    const product = await prisma.product.create({
      data: {
        userId,
        name: data.productName,
        brand: data.brand,
        category,
        code: data.code ?? undefined,
        specs: data.specs ?? undefined,
        size: data.size ?? undefined,
        madeIn: data.madeIn ?? undefined,
        material: data.material ?? undefined,
        status: 'PRECHECK',
      },
      select: { id: true, name: true, brand: true },
    });

    // 3) Prepare invoice PDF
    // 4) Send confirmation email (fire and forget)
    sendPrecheckConfirmation({
      to: normalizedEmail,
      name: data.name,
      productName: product.name,
    }).catch(() => { /* avoid blocking */ });

    // 5) Set session & respond with redirect to precheck overview
    await setSession({ userId, email: normalizedEmail });

    const params = new URLSearchParams();
    params.set('product', product.name);

    return NextResponse.json({
      ok: true,
      productId: product.id,
      redirect: `/precheck?productId=${product.id}&${params.toString()}`,
    });
  } catch (err: any) {
    console.error(err);
    if (err?.issues) {
      return NextResponse.json({ ok: false, errors: err.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: 'Precheck failed' }, { status: 500 });
  }
}
