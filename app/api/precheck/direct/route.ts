import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Plan } from '@prisma/client';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getPublicBaseUrl } from '@/lib/baseUrl';
import { sendPrecheckConfirmation } from '@/lib/email';
import { notifySuperadminsOfPrecheckRegistration } from '@/lib/precheckNotifications';

export const runtime = 'nodejs';

const BASE_FEE_CENTS = 17_900;
const FIXED_TAX_RATE_ID = process.env.STRIPE_TAX_RATE_19?.trim() || '';

const ProductSchema = z.object({
  productName: z.string().trim().min(2),
  brand: z.string().trim().min(1),
  category: z.string().trim().min(1),
  code: z.string().trim().min(2),
  specs: z.string().trim().optional().default(''),
});

const Schema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  company: z.string().trim().optional().default(''),
  agbAccepted: z.literal(true),
  products: z.array(ProductSchema).min(1).max(3),
});

export async function POST(req: Request) {
  try {
    const data = Schema.parse(await req.json());
    const email = data.email.toLowerCase();

    // Eingeloggte Nutzer verwenden ihr Konto, Gäste bekommen ein neues Konto ohne Login-Session.
    const session = await getSession();
    let user: { id: string; email: string; name: string } | null = null;
    let createdAccount = false;

    if (session) {
      user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, email: true, name: true },
      });
    } else {
      const existing = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json({ ok: false, error: 'EMAIL_EXISTS' }, { status: 409 });
      }
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      user = await prisma.user.create({
        data: { name: data.name, email, passwordHash, company: data.company || null },
        select: { id: true, email: true, name: true },
      });
      createdAccount = true;
    }
    if (!user) return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });

    const products = [];
    for (const p of data.products) {
      products.push(
        await prisma.product.create({
          data: {
            userId: user.id,
            name: p.productName,
            brand: p.brand,
            category: p.category,
            code: p.code,
            specs: p.specs || null,
            status: 'PRECHECK',
            adminProgress: 'PRECHECK',
            paymentStatus: 'UNPAID',
          },
          select: { id: true, name: true, brand: true, category: true, code: true },
        })
      );
    }

    const discountPercent = products.length <= 1 ? 0 : products.length === 2 ? 20 : 30;
    const perItemCents = Math.round(BASE_FEE_CENTS * (1 - discountPercent / 100));
    const baseUrl = getPublicBaseUrl();
    const primary = products[0];

    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      allow_promotion_codes: true,
      automatic_tax: { enabled: !FIXED_TAX_RATE_ID },
      billing_address_collection: 'required',
      tax_id_collection: { enabled: !FIXED_TAX_RATE_ID },
      client_reference_id: `${user.id}:${primary.id}:PRECHECK_FEE`,
      metadata: {
        productId: primary.id,
        productIds: JSON.stringify(products.map((p) => p.id)),
        userId: user.id,
        plan: 'PRECHECK_FEE',
        ...(createdAccount ? { guest: 'true' } : {}),
      },
      line_items: products.map((p) => ({
        price_data: {
          currency: 'eur',
          unit_amount: perItemCents,
          tax_behavior: 'exclusive' as const,
          product_data: { name: `Produkttest – ${p.name}` },
        },
        tax_rates: FIXED_TAX_RATE_ID ? [FIXED_TAX_RATE_ID] : undefined,
        quantity: 1,
      })),
      success_url: session
        ? `${baseUrl}/dashboard?baseFeeCheckout=success`
        : `${baseUrl}/produkte/produkt-test?direktZahlung=success`,
      cancel_url: `${baseUrl}/precheck?produkte=${products.length}#checkout-options`,
    });

    await prisma.order.create({
      data: {
        userId: user.id,
        productId: primary.id,
        plan: Plan.PRECHECK_FEE,
        priceCents: 0,
        stripeSessionId: checkout.id,
      },
    });

    for (const p of products) {
      void sendPrecheckConfirmation({
        to: user.email,
        name: user.name,
        gender: undefined,
        productName: p.name,
      }).catch((error) => console.error('DIRECT_CHECKOUT_CONFIRMATION_FAILED', { productId: p.id, error }));
      void notifySuperadminsOfPrecheckRegistration({
        productId: p.id,
        productName: p.name,
        brand: p.brand,
        category: p.category ?? '',
        code: p.code ?? '',
        customerName: user.name,
        customerEmail: user.email,
        customerCompany: data.company || null,
        sourceLabel: 'Direktkauf Produkttest',
      }).catch((error) => console.error('DIRECT_CHECKOUT_ADMIN_NOTIFY_FAILED', { productId: p.id, error }));
    }

    return NextResponse.json({ ok: true, url: checkout.url });
  } catch (err: any) {
    if (err?.issues) return NextResponse.json({ ok: false, errors: err.issues }, { status: 400 });
    console.error('DIRECT_CHECKOUT_FAILED', err);
    return NextResponse.json({ ok: false, error: 'DIRECT_CHECKOUT_FAILED' }, { status: 500 });
  }
}
