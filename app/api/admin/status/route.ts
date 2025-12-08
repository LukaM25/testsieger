import { NextResponse } from 'next/server';
import { ProductStatus } from '@prisma/client';
import { logAdminAudit, requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { sendFailureNotification, sendProductReceivedEmail, sendPassAndLicenseRequest, sendCompletionReadyEmail } from '@/lib/email';
import { fetchRatingCsv } from '@/lib/ratingSheet';

export const runtime = 'nodejs';

const VALID_STATUSES = ['RECEIVED', 'ANALYSIS', 'COMPLETION', 'PASS', 'FAIL'] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

export async function POST(req: Request) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { productId, status, note } = await req.json();
  if (!productId || !status) return NextResponse.json({ error: 'MISSING_PARAMS' }, { status: 400 });
  if (!VALID_STATUSES.includes(status as ValidStatus)) {
    return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { user: true, certificate: true },
  });
  if (!product) return NextResponse.json({ error: 'PRODUCT_NOT_FOUND' }, { status: 404 });

  const productUpdate: { adminProgress: ValidStatus; status?: ProductStatus } = {
    adminProgress: status as ValidStatus,
  };
  if (['RECEIVED', 'ANALYSIS', 'COMPLETION', 'PASS'].includes(status) && product.status === 'PRECHECK') {
    productUpdate.status = 'IN_REVIEW';
  }
  await prisma.product.update({
    where: { id: product.id },
    data: productUpdate,
  });

  await logAdminAudit({
    adminId: admin.id,
    action: 'PRODUCT_STATUS_UPDATE',
    entityType: 'Product',
    entityId: product.id,
    productId: product.id,
    payload: {
      from: product.adminProgress,
      to: status,
      note: note?.trim() || null,
    },
  });

  if (status === 'FAIL') {
    await sendFailureNotification({
      to: product.user.email,
      name: product.user.name,
      productName: product.name,
      reason: note?.trim() || 'Bitte reichen Sie fehlende Informationen nach, damit wir die Prüfung fortsetzen können.',
    }).catch((err) => {
      console.error('FAILURE_EMAIL_ERROR', err);
    });
  } else if (status === 'RECEIVED') {
    await sendProductReceivedEmail({
      to: product.user.email,
      name: product.user.name,
      productName: product.name,
    }).catch((err) => console.error('RECEIVED_EMAIL_ERROR', err));
  } else if (status === 'COMPLETION') {
    const csvBuffer = await fetchRatingCsv(product.id, product.name);
    await sendCompletionReadyEmail({
      to: product.user.email,
      name: product.user.name,
      productName: product.name,
      csvBuffer,
    }).catch((err) => console.error('COMPLETION_EMAIL_ERROR', err));
  } else if (status === 'PASS') {
    try {
      await sendPassAndLicenseRequest({
        to: product.user.email,
        name: product.user.name,
        productName: product.name,
      });
    } catch (err) {
      console.error('PASS_EMAIL_ERROR', err);
    }
  }

  return NextResponse.json({ ok: true, status });
}

async function generateSealNumber() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const part = Math.random().toString(36).slice(2, 8).toUpperCase();
    const seal = `PS-${new Date().getFullYear()}-${part}`;
    const exists = await prisma.certificate.findUnique({ where: { seal_number: seal } }).catch(() => null);
    if (!exists) return seal;
  }
  throw new Error('SEAL_GENERATION_FAILED');
}
