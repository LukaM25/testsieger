import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { sendLicensePlanReminderEmail, sendLicensePlanFinalReminderEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THREE_DAYS_MS = 72 * 60 * 60 * 1000;
const LICENSE_PLANS = new Set(['BASIC', 'PREMIUM', 'LIFETIME']);

function isAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') || '';
  if (header === `Bearer ${secret}`) return true;
  const url = new URL(req.url);
  const querySecret = url.searchParams.get('secret');
  return querySecret === secret;
}

function hasPaidLicense(product: {
  orders: Array<{ paidAt: Date | null; plan: string | null }>;
  license: { paidAt: Date | null; status: string | null; plan: string | null } | null;
}) {
  const hasPaidLicenseOrder = product.orders.some(
    (o) => Boolean(o.paidAt) && o.plan && LICENSE_PLANS.has(o.plan)
  );
  const hasPaidLicense =
    (Boolean(product.license?.paidAt) || product.license?.status === 'ACTIVE') &&
    Boolean(product.license?.plan) &&
    LICENSE_PLANS.has(product.license?.plan as string);
  return hasPaidLicenseOrder || hasPaidLicense;
}

function getReminderState(snapshotData: unknown) {
  const snap = (snapshotData || {}) as any;
  const rating = snap?.ratingV1 || {};
  const passEmailSentAt = typeof rating.passEmailSentAt === 'string' ? rating.passEmailSentAt : null;
  const licenseReminderSentAt =
    typeof rating.licenseReminderSentAt === 'string' ? rating.licenseReminderSentAt : null;
  const licenseFinalReminderSentAt =
    typeof rating.licenseFinalReminderSentAt === 'string' ? rating.licenseFinalReminderSentAt : null;
  return { passEmailSentAt, licenseReminderSentAt, licenseFinalReminderSentAt };
}

async function handleRequest(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || '25')));
  const now = Date.now();
  const firstCutoff = now - ONE_DAY_MS;
  const finalCutoff = now - THREE_DAYS_MS;

  const certificates = await prisma.certificate.findMany({
    where: {
      product: { adminProgress: 'PASS' },
    },
    take: limit,
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      snapshotData: true,
      product: {
        select: {
          id: true,
          name: true,
          orders: { select: { paidAt: true, plan: true } },
          license: { select: { paidAt: true, status: true, plan: true } },
          user: { select: { name: true, gender: true, email: true } },
        },
      },
    },
  });

  const results: Array<{ certificateId: string; productId: string; ok: boolean; skipped?: string }> = [];
  for (const cert of certificates) {
    const { passEmailSentAt, licenseReminderSentAt, licenseFinalReminderSentAt } =
      getReminderState(cert.snapshotData);
    if (!passEmailSentAt) {
      results.push({ certificateId: cert.id, productId: cert.product.id, ok: false, skipped: 'NO_PASS_EMAIL' });
      continue;
    }
    if (licenseFinalReminderSentAt) {
      results.push({ certificateId: cert.id, productId: cert.product.id, ok: false, skipped: 'ALREADY_SENT' });
      continue;
    }
    const passTime = Date.parse(passEmailSentAt);
    if (!Number.isFinite(passTime)) {
      results.push({ certificateId: cert.id, productId: cert.product.id, ok: false, skipped: 'INVALID_PASS_DATE' });
      continue;
    }
    if (hasPaidLicense(cert.product)) {
      results.push({ certificateId: cert.id, productId: cert.product.id, ok: false, skipped: 'LICENSE_PAID' });
      continue;
    }
    if (!cert.product.user?.email) {
      results.push({ certificateId: cert.id, productId: cert.product.id, ok: false, skipped: 'NO_EMAIL' });
      continue;
    }

    const shouldSendFinal = passTime <= finalCutoff && !licenseFinalReminderSentAt;
    const shouldSendFirst = passTime <= firstCutoff && !licenseReminderSentAt;

    if (!shouldSendFinal && !shouldSendFirst) {
      results.push({ certificateId: cert.id, productId: cert.product.id, ok: false, skipped: 'TOO_SOON' });
      continue;
    }

    try {
      if (shouldSendFinal) {
        await sendLicensePlanFinalReminderEmail({
          to: cert.product.user.email,
          name: cert.product.user.name ?? '',
          gender: cert.product.user.gender ?? undefined,
          productName: cert.product.name,
        });
      } else if (shouldSendFirst) {
        await sendLicensePlanReminderEmail({
          to: cert.product.user.email,
          name: cert.product.user.name ?? '',
          gender: cert.product.user.gender ?? undefined,
          productName: cert.product.name,
        });
      }
      const prev = (cert.snapshotData || {}) as any;
      const ratingV1 = (prev.ratingV1 || {}) as any;
      await prisma.certificate.update({
        where: { id: cert.id },
        data: {
          snapshotData: {
            ...prev,
            ratingV1: {
              ...ratingV1,
              ...(shouldSendFinal
                ? { licenseFinalReminderSentAt: new Date().toISOString() }
                : { licenseReminderSentAt: new Date().toISOString() }),
            },
          } as any,
        },
      });
      results.push({ certificateId: cert.id, productId: cert.product.id, ok: true });
    } catch (err: any) {
      results.push({
        certificateId: cert.id,
        productId: cert.product.id,
        ok: false,
        skipped: err?.message || 'SEND_FAILED',
      });
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}

export async function POST(req: Request) {
  return handleRequest(req);
}

export async function GET(req: Request) {
  return handleRequest(req);
}
