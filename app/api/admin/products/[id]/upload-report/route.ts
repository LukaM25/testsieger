import { NextResponse } from 'next/server';
import { AdminRole } from '@prisma/client';

import { logAdminAudit, requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { uploadToS3, s3PublicUrl, ensureSignedS3Url } from '@/lib/s3';

export const runtime = 'nodejs';

async function generateSealNumber() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const part = Math.random().toString(36).slice(2, 8).toUpperCase();
    const seal = `PS-${new Date().getFullYear()}-${part}`;
    const exists = await prisma.certificate.findUnique({ where: { seal_number: seal } }).catch(() => null);
    if (!exists) return seal;
  }
  throw new Error('SEAL_GENERATION_FAILED');
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireAdmin(AdminRole.SUPERADMIN);
  } catch {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { id: productId } = await params;
  if (!productId) {
    return NextResponse.json({ error: 'MISSING_PRODUCT_ID' }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get('report') as File | null;
  if (!file) return NextResponse.json({ error: 'REPORT_REQUIRED' }, { status: 400 });
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'REPORT_MUST_BE_PDF' }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { certificate: true },
    });
    if (!product) return NextResponse.json({ error: 'PRODUCT_NOT_FOUND' }, { status: 404 });

    const reportBuffer = Buffer.from(await file.arrayBuffer());

    const certificateRecord =
      product.certificate ||
      (await prisma.certificate.create({
        data: { productId: product.id, pdfUrl: '', qrUrl: '', seal_number: await generateSealNumber() },
      }));

    const seal = certificateRecord.seal_number || (await generateSealNumber());
    const certificateId = certificateRecord.id;

    const reportKey = `uploads/UPLOADED_REPORT_${seal}.pdf`;
    const reportUrl = s3PublicUrl(reportKey);
    await uploadToS3({ key: reportKey, body: reportBuffer, contentType: 'application/pdf' });

    await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        seal_number: seal,
        reportUrl,
      },
    });

    await logAdminAudit({
      adminId: admin.id,
      action: 'UPLOAD_REPORT',
      entityType: 'Product',
      entityId: product.id,
      productId: product.id,
      payload: { certificateId, reportUrl },
    });

    return NextResponse.json({
      ok: true,
      certificateId,
      reportUrl,
      signedReportUrl: await ensureSignedS3Url(reportUrl),
    });
  } catch (err: any) {
    console.error('ADMIN_REPORT_UPLOAD_ERROR', err);
    return NextResponse.json({ error: 'UPLOAD_FAILED' }, { status: 500 });
  }
}
