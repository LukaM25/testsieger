import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { setSession } from '@/lib/cookies';
import { getSession } from '@/lib/auth';
import {
  findValidPrecheckInviteByToken,
  parsePrecheckInviteProductData,
} from '@/lib/precheckInvite';
import { sendPrecheckConfirmation } from '@/lib/email';
import { notifySuperadminsOfPrecheckRegistration } from '@/lib/precheckNotifications';
import { hasAnalyticsConsent, recordAnalyticsEvent } from '@/lib/analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || '';
  const invite = await findValidPrecheckInviteByToken(token);
  if (!invite) {
    return NextResponse.json({ ok: false, error: 'INVALID_OR_EXPIRED' }, { status: 404 });
  }

  const productData = parsePrecheckInviteProductData(invite.productData);
  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: invite.email, mode: 'insensitive' }, active: true, deletedAt: null },
    select: { id: true, email: true },
  });
  const session = await getSession();
  const canClaimWithSession = Boolean(existingUser && session?.userId === existingUser.id);

  return NextResponse.json({
    ok: true,
    invite: {
      email: invite.email,
      contactName: invite.contactName,
      productName: productData.productName,
      brand: productData.brand,
      expiresAt: invite.expiresAt.toISOString(),
    },
    existingAccount: Boolean(existingUser),
    canClaimWithSession,
    sessionEmail: session?.email ?? null,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token || '');
  const password = typeof body.password === 'string' ? body.password : '';
  const accountName = typeof body.name === 'string' ? body.name.trim() : '';

  const invite = await findValidPrecheckInviteByToken(token);
  if (!invite) {
    return NextResponse.json({ ok: false, error: 'INVALID_OR_EXPIRED' }, { status: 400 });
  }

  const productData = parsePrecheckInviteProductData(invite.productData);
  const normalizedEmail = invite.email.trim().toLowerCase();
  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: normalizedEmail, mode: 'insensitive' }, active: true, deletedAt: null },
    select: { id: true, email: true, name: true },
  });
  const session = await getSession();

  if (existingUser && session?.userId !== existingUser.id) {
    return NextResponse.json(
      {
        ok: false,
        error: 'LOGIN_REQUIRED',
        redirect: `/login?email=${encodeURIComponent(normalizedEmail)}&next=${encodeURIComponent(`/precheck/claim?token=${token}`)}`,
      },
      { status: 409 }
    );
  }

  if (!existingUser && password.length < 8) {
    return NextResponse.json({ ok: false, error: 'WEAK_PASSWORD' }, { status: 400 });
  }
  if (!existingUser && accountName.length < 2) {
    return NextResponse.json({ ok: false, error: 'MISSING_NAME' }, { status: 400 });
  }

  const passwordHash = existingUser ? null : await bcrypt.hash(password, 12);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const claimed = await tx.precheckInvite.updateMany({
        where: { id: invite.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) {
        throw new Error('INVITE_ALREADY_USED');
      }

      const user =
        existingUser ??
        (await tx.user.create({
          data: {
            gender: invite.gender,
            name: accountName,
            email: normalizedEmail,
            passwordHash: passwordHash!,
            address: invite.address ?? undefined,
            company: invite.company ?? undefined,
          },
          select: { id: true, email: true, name: true },
        }));

      const product = await tx.product.create({
        data: {
          userId: user.id,
          name: productData.productName,
          brand: productData.brand,
          category: productData.category,
          code: productData.code,
          specs: productData.specs,
          size: productData.size || undefined,
          madeIn: productData.madeIn || undefined,
          material: productData.material || undefined,
          status: 'PRECHECK',
          adminProgress: 'PRECHECK',
          paymentStatus: 'UNPAID',
        },
        select: { id: true, name: true, brand: true, category: true, code: true },
      });

      await tx.precheckInvite.update({
        where: { id: invite.id },
        data: { userId: user.id, productId: product.id },
      });

      return { user, product };
    });

    await setSession({ userId: result.user.id, email: result.user.email });

    void sendPrecheckConfirmation({
      to: result.user.email,
      name: result.user.name,
      gender: invite.gender ?? undefined,
      productName: result.product.name,
    }).catch((error) => {
      console.error('PRECHECK_CONFIRMATION_EMAIL_FAILED', { productId: result.product.id, error });
    });

    void notifySuperadminsOfPrecheckRegistration({
      productId: result.product.id,
      productName: result.product.name,
      brand: result.product.brand,
      category: result.product.category,
      code: result.product.code,
      customerName: result.user.name,
      customerEmail: result.user.email,
      customerCompany: invite.company ?? null,
      sourceLabel: 'Precheck-E-Mail-Claim',
    }).catch((error) => {
      console.error('PRECHECK_SUPERADMIN_NOTIFICATION_ERROR', { productId: result.product.id, error });
    });

    if (hasAnalyticsConsent(req)) {
      void recordAnalyticsEvent({
        name: 'precheck_invite_claim',
        path: '/precheck/claim',
        userId: result.user.id,
        productId: result.product.id,
        metadata: {
          existingAccount: Boolean(existingUser),
          category: result.product.category,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      productId: result.product.id,
      redirect: `/precheck/details?productId=${result.product.id}`,
    });
  } catch (error: any) {
    if (error?.message === 'INVITE_ALREADY_USED') {
      return NextResponse.json({ ok: false, error: 'INVALID_OR_EXPIRED' }, { status: 400 });
    }
    console.error('PRECHECK_CLAIM_FAILED', error);
    return NextResponse.json({ ok: false, error: 'CLAIM_FAILED' }, { status: 500 });
  }
}
