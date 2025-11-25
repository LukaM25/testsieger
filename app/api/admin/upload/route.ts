import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import path from 'path';
import { promises as fs } from 'fs';
import QRCode from 'qrcode';
import { sendCompletionEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const form = await req.formData();
    const productId = String(form.get('productId') || '');
    const file = form.get('report') as File | null;

    if (!productId || !file) {
      return NextResponse.json({ error: 'Missing productId or report' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Report must be a PDF' }, { status: 400 });
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

    // paths (local dev). For prod, replace with S3 uploads.
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const qrDir = path.join(process.cwd(), 'public', 'qr');
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(qrDir, { recursive: true });

    const arrayBuf = await file.arrayBuffer();
    const buff = Buffer.from(arrayBuf);
    const pdfRel = `/uploads/REPORT_${seal}.pdf`;
    const pdfAbs = path.join(uploadsDir, `REPORT_${seal}.pdf`);
    await fs.writeFile(pdfAbs, buff);

    // Create verify URL (public page)
    const verifyUrl = `${process.env.APP_URL}/verify/${seal}`;

    // Generate QR png -> save
    const qrPng = await QRCode.toBuffer(verifyUrl, { margin: 1, width: 512 });
    const qrRel = `/qr/${seal}.png`;
    const qrAbs = path.join(qrDir, `${seal}.png`);
    await fs.writeFile(qrAbs, qrPng);

    // Create certificate row
    const cert = await prisma.certificate.create({
      data: {
        productId: product.id,
        pdfUrl: pdfRel,
        qrUrl: qrRel,
        seal_number: seal,
        // pdfmonkeyDocumentId: (optional later)
      },
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
      pdfUrl: pdfRel,
      qrUrl: qrRel,
    }).catch(e => console.error('Email error', e));

    return NextResponse.json({ ok: true, verifyUrl, certId: cert.id });
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
