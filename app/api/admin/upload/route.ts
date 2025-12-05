import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { AssetType } from '@prisma/client';

import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { sendCompletionEmail } from '@/lib/email';
import { generateSeal as generateSealImage } from '@/lib/seal';
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
  try {
    await requireAdmin();

    const form = await req.formData();
    const productId = String(form.get('productId') || '');
    const message = form.get('message');
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

    // Generate seal image and store path
    let sealUrl: string | null = null;
    let sealBuffer: Buffer | undefined;
    try {
      sealUrl = await generateSealImage({
        product: { id: product.id, name: product.name, brand: product.brand, createdAt: product.createdAt },
        certificateId: cert.id,
        ratingScore: cert.ratingScore ?? 'PASS',
        ratingLabel: cert.ratingLabel ?? 'PASS',
        appUrl: process.env.APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      });
      const sealAbs = path.join(process.cwd(), 'public', sealUrl.replace(/^\//, ''));
      sealBuffer = await fs.readFile(sealAbs);
    } catch (err) {
      console.warn('SEAL_GENERATION_FAILED', err);
    }
    if (!sealBuffer) {
      throw new Error('SEAL_MISSING');
    }

    await prisma.certificate.update({
      where: { id: cert.id },
      data: { sealUrl },
    });

    // Mark product as COMPLETED
    await prisma.product.update({
      where: { id: product.id },
      data: { status: 'COMPLETED' },
    });

    // Email customer with links

    await sendCompletionEmail({
      to: product.user.email,
      name: product.user.name,
      productName: product.name,
      verifyUrl,
      pdfUrl: pdfSigned,
      qrUrl: qrSigned,
      message: typeof message === 'string' ? message.slice(0, 1000) : undefined,
      sealNumber: seal,
      sealBuffer,
    }).catch(e => console.error('Email error', e));

    return NextResponse.json({ ok: true, verifyUrl, certId: cert.id, pdfUrl: pdfSigned });
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
