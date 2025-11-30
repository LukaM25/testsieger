import path from 'path';
import { promises as fs } from 'fs';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { sendCompletionEmail } from '@/lib/email';
import { generateCertificatePdf } from '@/pdfGenerator';

const APP_URL = process.env.APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

export class CompletionError extends Error {
  constructor(
    public code: string,
    public status: number = 400,
    public payload?: Record<string, any>,
  ) {
    super(code);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export type CompletionResult = {
  verifyUrl: string;
  certId: string;
  pdfUrl: string;
  qrUrl: string;
  seal: string;
};

/**
 * Creates the certificate PDF, stores the assets, marks the product completed and emails the customer.
 */
export async function completeProduct(productId: string, message?: string): Promise<CompletionResult> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { user: true, certificate: true },
  });
  if (!product) throw new CompletionError('PRODUCT_NOT_FOUND', 404);
  if (!['PAID', 'IN_REVIEW'].includes(product.status)) {
    throw new CompletionError('INVALID_STATUS', 400);
  }

  const seal = product.certificate?.seal_number ?? (await generateSeal());
  const certificateRecord =
    product.certificate ??
    (await prisma.certificate.create({
      data: { productId: product.id, pdfUrl: '', qrUrl: '', seal_number: seal },
    }));
  const certificateId = certificateRecord.id;
  const verifyUrl = `${APP_URL.replace(/\/$/, '')}/lizenzen?q=${encodeURIComponent(certificateId)}`;
  const qrBuffer = await QRCode.toBuffer(verifyUrl, { margin: 1, width: 512 });

  const pdfBuffer = await generateCertificatePdf({
    product: {
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category ?? null,
      code: product.code ?? null,
      specs: product.specs ?? null,
      size: product.size ?? null,
      madeIn: product.madeIn ?? null,
      material: product.material ?? null,
      status: product.status,
      adminProgress: product.adminProgress,
      paymentStatus: product.paymentStatus,
      createdAt: product.createdAt.toISOString(),
    },
    user: {
      name: product.user.name,
      email: product.user.email,
      address: product.user.address ?? null,
      company: product.user.company ?? null,
    },
    certificate: {
      seal_number: seal,
      pdfUrl: certificateRecord.pdfUrl ?? undefined,
      qrUrl: certificateRecord.qrUrl ?? undefined,
      externalReferenceId: certificateRecord.externalReferenceId ?? undefined,
    },
    certificateId,
    domain: APP_URL,
  });

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const qrDir = path.join(process.cwd(), 'public', 'qr');
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.mkdir(qrDir, { recursive: true });

  const pdfRel = `/uploads/REPORT_${seal}.pdf`;
  const pdfAbs = path.join(uploadsDir, `REPORT_${seal}.pdf`);
  await fs.writeFile(pdfAbs, pdfBuffer);

  const qrRel = `/qr/${seal}.png`;
  const qrAbs = path.join(qrDir, `${seal}.png`);
  await fs.writeFile(qrAbs, qrBuffer);

  const cert = await prisma.certificate.upsert({
    where: { productId: product.id },
    update: {
      pdfUrl: pdfRel,
      qrUrl: qrRel,
      seal_number: seal,
      externalReferenceId: null,
    },
    create: {
      productId: product.id,
      pdfUrl: pdfRel,
      qrUrl: qrRel,
      seal_number: seal,
      externalReferenceId: null,
    },
  });

  await prisma.product.update({
    where: { id: product.id },
    data: { status: 'COMPLETED', adminProgress: 'PASS' },
  });

  await sendCompletionEmail({
    to: product.user.email,
    name: product.user.name,
    productName: product.name,
    verifyUrl,
    pdfUrl: pdfRel,
    qrUrl: qrRel,
    pdfBuffer,
    documentId: undefined,
    message,
  });

  return {
    verifyUrl,
    certId: cert.id,
    pdfUrl: pdfRel,
    qrUrl: qrRel,
    seal,
  };
}

async function generateSeal() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const part = Math.random().toString(36).slice(2, 8).toUpperCase();
    const seal = `PS-${new Date().getFullYear()}-${part}`;
    const exists = await prisma.certificate.findUnique({ where: { seal_number: seal } }).catch(() => null);
    if (!exists) return seal;
  }
  throw new CompletionError('SEAL_GENERATION_FAILED', 500);
}
