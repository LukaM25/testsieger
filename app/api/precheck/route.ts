// app/api/precheck/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { setSession } from '@/lib/cookies';
import { sendPrecheckConfirmation } from '@/lib/email';
import { stripe } from '@/lib/stripe';
import { generateInvoicePdf } from '@/lib/invoice';

const PrecheckSchema = z.object({
  name: z.string().min(2),
  company: z.string().optional().nullable(),
  email: z.string().email(),
  address: z.string().min(5),
  password: z.string().min(8, 'Passwort min. 8 Zeichen'),
  // product
  productName: z.string().min(2),
  brand: z.string().min(1),
  category: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  specs: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  madeIn: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = PrecheckSchema.parse(json);
    const category = data.category?.trim() || undefined;

    // 1) Ensure user exists (or create)
    const existing = await prisma.user.findUnique({ where: { email: data.email } });

    let userId: string;
    if (!existing) {
      const passwordHash = await bcrypt.hash(data.password, 12);
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.APP_URL || 'http://localhost:3000';

    // 3) Prepare invoice PDF
    const invoicePdf = await generateInvoicePdf({
      customerName: data.name,
      customerEmail: data.email,
      address: data.address,
      productName: product.name,
      amountCents: 25400,
      invoiceNumber: `PC-${product.id.slice(0, 8)}`,
    });

    // 4) Send confirmation email (fire and forget)
    sendPrecheckConfirmation({
      to: data.email,
      name: data.name,
      productName: product.name,
      invoicePdf,
      shippingAddress: data.address,
    }).catch(() => { /* avoid blocking */ });

    // 5) Create checkout session for Grundgebühr
    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: data.email,
      client_reference_id: `${userId}:${product.id}:PRECHECK_FEE`,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: 25400,
            product_data: {
              name: `Pre-Check: ${product.name}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/precheck?productId=${product.id}&product=${encodeURIComponent(product.name)}`,
      cancel_url: `${baseUrl}/precheck?productId=${product.id}&product=${encodeURIComponent(product.name)}`,
    });

    // 6) Set session & respond with checkout URL
    await setSession({ userId, email: data.email });

    const params = new URLSearchParams();
    params.set('product', product.name);

    return NextResponse.json({
      ok: true,
      productId: product.id,
      redirect: checkout.url ?? `/precheck?productId=${product.id}&${params.toString()}`,
    });
  } catch (err: any) {
    console.error(err);
    if (err?.issues) {
      return NextResponse.json({ ok: false, errors: err.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: 'Precheck failed' }, { status: 500 });
  }
}
