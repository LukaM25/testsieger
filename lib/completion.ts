import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs/promises';
import { prisma } from '@/lib/prisma';
import { sendCompletionEmail } from '@/lib/email';
import { generateCertificatePdf } from '@/pdfGenerator';
import { uploadToS3, s3PublicUrl } from '@/lib/s3';
import { generateInvoicePdf } from '@/lib/invoiceBuilder';
import { InvoiceLine } from '@/lib/invoiceBuilder';
import { fetchRatingCsv } from '@/lib/ratingSheet';
import { generateSeal as generateSealImage } from '@/lib/seal';

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
    include: { user: true, certificate: true, orders: true, license: true },
  });
  if (!product) throw new CompletionError('PRODUCT_NOT_FOUND', 404);
  if (!['PAID', 'IN_REVIEW', 'COMPLETED'].includes(product.status)) {
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

  // Upload assets to S3 instead of local filesystem
  const pdfKey = `uploads/REPORT_${seal}.pdf`;
  const qrKey = `qr/${seal}.png`;
    await uploadToS3({ key: pdfKey, body: pdfBuffer, contentType: 'application/pdf' });
    await uploadToS3({ key: qrKey, body: qrBuffer, contentType: 'image/png' });

    const pdfUrl = s3PublicUrl(pdfKey);
    const qrUrl = s3PublicUrl(qrKey);

  let cert = await prisma.certificate.upsert({
    where: { productId: product.id },
    update: {
      pdfUrl,
      qrUrl,
      seal_number: seal,
      externalReferenceId: null,
    },
    create: {
      productId: product.id,
      pdfUrl,
      qrUrl,
      seal_number: seal,
      externalReferenceId: null,
    },
  });

  // Ensure seal image exists and load it
  let sealBuffer: Buffer | undefined;
  let sealUrl = cert.sealUrl || product.certificate?.sealUrl || null;
  if (!sealUrl) {
    try {
      const generatedSealPath = await generateSealImage({
        product: { id: product.id, name: product.name, brand: product.brand, createdAt: product.createdAt },
        certificateId: cert.id,
        ratingScore: cert.ratingScore ?? 'PASS',
        ratingLabel: cert.ratingLabel ?? 'PASS',
        appUrl: APP_URL,
      });
      sealUrl = generatedSealPath;
      cert = await prisma.certificate.update({
        where: { id: cert.id },
        data: { sealUrl: generatedSealPath },
      });
    } catch (err) {
      console.warn('SEAL_GENERATION_FAILED', err);
    }
  }
  if (sealUrl) {
    try {
      const sealPath = path.join(process.cwd(), 'public', sealUrl.replace(/^\//, ''));
      sealBuffer = await fs.readFile(sealPath);
    } catch (err) {
      console.warn('SEAL_BUFFER_LOAD_FAILED', { sealUrl, err });
    }
  }
  if (!sealBuffer) {
    throw new CompletionError('SEAL_MISSING', 500);
  }

  await prisma.product.update({
    where: { id: product.id },
    data: { status: 'COMPLETED', adminProgress: 'PASS' },
  });

  // Build invoice lines (best-effort)
  const invoiceLines: InvoiceLine[] = [];
  if (product.paymentStatus !== 'UNPAID') {
    invoiceLines.push({
      label: 'Grundgebühr',
      amountCents: 25400,
    });
  }
  product.orders
    .filter((o) => o.paidAt && o.plan)
    .forEach((o) => {
      if (typeof o.priceCents === 'number' && o.priceCents > 0) {
        invoiceLines.push({
          label: `Lizenz ${o.plan}`,
          amountCents: o.priceCents,
        });
      }
    });

  let invoiceBuffer: Buffer | undefined;
  if (invoiceLines.length) {
    try {
      invoiceBuffer = await generateInvoicePdf({
        invoiceNumber: `INV-${product.id.slice(0, 8)}`,
        customerName: product.user.name,
        customerEmail: product.user.email,
        customerAddress: product.user.address ?? null,
        productName: product.name,
        lines: invoiceLines,
        currency: 'EUR',
      });
    } catch (err) {
      console.error('INVOICE_GENERATION_ERROR', err);
    }
  }

  await sendCompletionEmail({
    to: product.user.email,
    name: product.user.name,
    productName: product.name,
    verifyUrl,
    pdfUrl,
    qrUrl,
    pdfBuffer,
    documentId: undefined,
    message,
    sealNumber: seal,
    csvBuffer: await fetchRatingCsv(product.id, product.name),
    sealBuffer,
    invoiceBuffer,
  });

  return {
    verifyUrl,
    certId: cert.id,
    pdfUrl,
    qrUrl,
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
