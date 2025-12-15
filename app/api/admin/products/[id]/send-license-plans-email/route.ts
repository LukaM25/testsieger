import { NextResponse } from 'next/server';
import { AdminRole } from '@prisma/client';
import crypto from 'crypto';

import { requireAdmin, logAdminAudit } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { fetchStoredRatingPdfAttachment } from '@/lib/ratingSheet';
import { sendCompletionReadyEmail } from '@/lib/email';

export const runtime = 'nodejs';

function sha256(input: Buffer) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(AdminRole.EXAMINER).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { id: productId } = await params;
  if (!productId) return NextResponse.json({ error: 'MISSING_PRODUCT_ID' }, { status: 400 });

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      paymentStatus: true,
      adminProgress: true,
      user: { select: { email: true, name: true } },
      certificate: { select: { id: true, snapshotData: true } },
    },
  });
  if (!product) return NextResponse.json({ error: 'PRODUCT_NOT_FOUND' }, { status: 404 });

  const eligiblePayment = product.paymentStatus === 'PAID' || product.paymentStatus === 'MANUAL';
  const eligibleProgress = product.adminProgress === 'PASS';
  if (!eligiblePayment || !eligibleProgress) {
    return NextResponse.json({ error: 'NOT_ELIGIBLE' }, { status: 400 });
  }

  const ratingPdf = await fetchStoredRatingPdfAttachment(product.id);
  if (!ratingPdf?.buffer) {
    return NextResponse.json({ error: 'RATING_PDF_MISSING' }, { status: 400 });
  }
  const attachmentBuffer = ratingPdf.buffer;
  const pdfHash = ratingPdf.sha256 || sha256(attachmentBuffer);

  const lastSend = await prisma.adminAudit.findFirst({
    where: { productId: product.id, action: 'SEND_LICENSE_PLANS_EMAIL' },
    orderBy: { createdAt: 'desc' },
    select: { payload: true },
  });
  const lastHash = (lastSend?.payload as any)?.pdfHash as string | undefined;
  if (lastHash && lastHash === pdfHash) {
    return NextResponse.json({ error: 'PDF_NOT_UPDATED' }, { status: 409 });
  }

  const appUrl = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'http://pruefsiegelzentrum.vercel.app').replace(/\/$/, '');
  await sendCompletionReadyEmail({
    to: product.user.email,
    name: product.user.name,
    productName: product.name,
    licenseUrl: `${appUrl}/pakete?productId=${encodeURIComponent(product.id)}`,
    ratingPdfBuffer: attachmentBuffer,
  });

  // Lock rating after sending email #4
  if (product.certificate?.id) {
    const prev = (product.certificate.snapshotData || {}) as any;
    const ratingV1 = (prev.ratingV1 || {}) as any;
    const nextSnapshot = {
      ...prev,
      ratingV1: {
        ...ratingV1,
        lockedAt: new Date().toISOString(),
        lockedByAdminId: admin.id,
        passEmailSentAt: new Date().toISOString(),
        pdf: {
          ...(ratingV1.pdf || {}),
          key: ratingPdf.key,
          sha256: pdfHash,
          updatedAt: (ratingV1.pdf && ratingV1.pdf.updatedAt) || new Date().toISOString(),
        },
      },
    };
    await prisma.certificate.update({
      where: { id: product.certificate.id },
      data: { snapshotData: nextSnapshot as any },
    });
  }

  await logAdminAudit({
    adminId: admin.id,
    action: 'SEND_LICENSE_PLANS_EMAIL',
    entityType: 'Product',
    entityId: product.id,
    productId: product.id,
    payload: {
      pdfHash,
      pdfBytes: attachmentBuffer.length,
      ratingScope: 'stored',
    },
  });

  return NextResponse.json({ ok: true });
}
