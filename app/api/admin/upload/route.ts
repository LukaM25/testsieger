import { NextResponse } from 'next/server';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { AdminRole, AssetType } from '@prisma/client';

import { logAdminAudit, requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { generateSealForS3 } from '@/lib/seal';
import { saveBufferToS3, signedUrlForKey, MAX_UPLOAD_BYTES } from '@/lib/storage';
import { uploadedPdfKey, qrKey } from '@/lib/assetKeys';

const SIGNED_URL_FALLBACK = 'SIGNED_URL_UNAVAILABLE';

async function signOrFallback(key: string) {
  try {
    return await signedUrlForKey(key);
  } catch (err) {
    console.error('SIGNED_URL_FAILED', { key, error: err });
    return SIGNED_URL_FALLBACK;
  }
}

export async function POST(req: Request) {
  let admin;
  try {
    admin = await requireAdmin(AdminRole.SUPERADMIN);

    const form = await req.formData();
    const productId = String(form.get('productId') || '');
    const file = form.get('report') as File | null;

    if (!productId || !file) {
      return NextResponse.json({ error: 'Missing productId or report' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Report must be a PDF' }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Report too large' }, { status: 400 });
    }

    // fetch product + user
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { user: true, certificate: true },
    });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    if (product.certificate) return NextResponse.json({ error: 'Certificate already exists' }, { status: 400 });

    // generate seal number
    const seal = await generateSeal();

    const arrayBuf = await file.arrayBuffer();
    const buff = Buffer.from(arrayBuf);
    if (buff.length > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Report too large' }, { status: 400 });
    }

    // Create certificate row early to link assets
    const cert = await prisma.certificate.create({
      data: {
        productId: product.id,
        pdfUrl: '',
        qrUrl: '',
        seal_number: seal,
      },
    });

    const baseDomain =
      process.env.NEXT_PUBLIC_BASE_URL || process.env.APP_URL || 'http://localhost:3000';
    const verifyUrl = `${baseDomain.replace(/\/$/, '')}/lizenzen?q=${encodeURIComponent(cert.id)}`;

    // Generate QR png -> save
    const qrPng = await QRCode.toBuffer(verifyUrl, { margin: 1, width: 512 });

    const fileName = file.name?.toString() || 'report.pdf';
    const ext = (fileName.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf';
    const pdfKey = uploadedPdfKey(seal, ext);
    const qrKeyStr = qrKey(seal);

    await saveBufferToS3({
      key: pdfKey,
      body: buff,
      contentType: file.type,
    });

    await saveBufferToS3({
      key: qrKeyStr,
      body: qrPng,
      contentType: 'image/png',
    });

    const pdfHash = crypto.createHash('sha256').update(buff).digest('hex');
    const qrHash = crypto.createHash('sha256').update(qrPng).digest('hex');

    await prisma.asset.createMany({
      data: [
        {
          type: AssetType.UPLOADED_PDF,
          key: pdfKey,
          contentType: file.type,
          sizeBytes: buff.length,
          sha256: pdfHash,
          certificateId: cert.id,
          productId: product.id,
          userId: product.userId,
        },
        {
          type: AssetType.CERTIFICATE_QR,
          key: qrKeyStr,
          contentType: 'image/png',
          sizeBytes: qrPng.length,
          sha256: qrHash,
          certificateId: cert.id,
          productId: product.id,
          userId: product.userId,
        },
      ],
    });

    const pdfSigned = await signOrFallback(pdfKey);
    const qrSigned = await signOrFallback(qrKeyStr);

    // Update certificate row with signed URLs for compatibility
    await prisma.certificate.update({
      where: { id: cert.id },
      data: {
        pdfUrl: pdfSigned,
        qrUrl: qrSigned,
        reportUrl: pdfSigned,
      },
    });

    const baseAppUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const generatedSeal = await generateSealForS3({
      product: { id: product.id, name: product.name, brand: product.brand, createdAt: product.createdAt },
      certificateId: cert.id,
      tcCode: product.processNumber ?? undefined,
      ratingScore: cert.ratingScore ?? 'PASS',
      ratingLabel: cert.ratingLabel ?? 'PASS',
      appUrl: baseAppUrl,
    });
    await saveBufferToS3({ key: generatedSeal.key, body: generatedSeal.buffer, contentType: 'image/png' });
    await prisma.asset.upsert({
      where: { key: generatedSeal.key },
      update: {
        type: AssetType.SEAL_IMAGE,
        contentType: 'image/png',
        sizeBytes: generatedSeal.buffer.length,
        certificateId: cert.id,
        productId: product.id,
        userId: product.userId,
      },
      create: {
        key: generatedSeal.key,
        type: AssetType.SEAL_IMAGE,
        contentType: 'image/png',
        sizeBytes: generatedSeal.buffer.length,
        certificateId: cert.id,
        productId: product.id,
        userId: product.userId,
      },
    });

    await prisma.certificate.update({
      where: { id: cert.id },
      data: { sealUrl: generatedSeal.key },
    });

    await logAdminAudit({
      adminId: admin.id,
      action: 'UPLOAD_CERTIFICATE',
      entityType: 'Product',
      entityId: product.id,
      productId: product.id,
      payload: { certificateId: cert.id, seal },
    });

    const sealSigned = await signOrFallback(generatedSeal.key);
    return NextResponse.json({ ok: true, verifyUrl, certId: cert.id, pdfUrl: pdfSigned, sealUrl: sealSigned });
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

async function generateSeal() {
  // ensure uniqueness
  // e.g., PS-2025-XXXXXX
  const part = Math.random().toString(36).slice(2, 8).toUpperCase();
  const seal = `PS-${new Date().getFullYear()}-${part}`;
  // optional: check DB collision
  return seal;
}
