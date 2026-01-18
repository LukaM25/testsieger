import QRCode from 'qrcode';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendCompletionEmail } from '@/lib/email';
import { generateCertificatePdf } from '@/pdfGenerator';
import { generateInvoicePdf } from '@/lib/invoiceBuilder';
import { InvoiceLine } from '@/lib/invoiceBuilder';
import { generateSealForS3 } from '@/lib/seal';
import { storeCertificateAssets } from '@/lib/certificateAssets';
import { CompletionJob, CompletionJobStatus, AssetType } from '@prisma/client';
import { saveBufferToS3, signedUrlForKey } from '@/lib/storage';
import { ensureSignedS3Url } from '@/lib/s3';
import { fetchStoredRatingPdfAttachment, getRatingLockState } from '@/lib/ratingSheet';

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
  return runCompletion(productId, message);
}

/**
 * Enqueue a completion job for asynchronous processing without running heavy work immediately.
 */
export async function enqueueCompletionJob(
  productId: string,
  // message is accepted for future compatibility; currently not persisted on the job
  message?: string | null,
): Promise<CompletionJob> {
  void message;
  const existing = await prisma.completionJob.findFirst({
    where: {
      productId,
      status: { in: [CompletionJobStatus.PENDING, CompletionJobStatus.RUNNING] },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (existing) return existing;

  return prisma.completionJob.create({
    data: {
      productId,
      certificateId: null,
      status: CompletionJobStatus.PENDING,
      attempts: 0,
      lastError: null,
    },
  });
}

/**
 * Process a single completion job by id. Moves the job to RUNNING, executes the completion pipeline,
 * and updates status to COMPLETED or FAILED accordingly.
 */
export async function processCompletionJob(jobId: string, opts?: { force?: boolean }): Promise<CompletionResult> {
  const job = await prisma.completionJob.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new CompletionError('JOB_NOT_FOUND', 404);
  }
  if (job.status !== CompletionJobStatus.PENDING && job.status !== CompletionJobStatus.FAILED) {
    throw new CompletionError('JOB_NOT_PROCESSABLE', 400, { status: job.status });
  }

  const running = await prisma.completionJob.update({
    where: { id: jobId },
    data: {
      status: CompletionJobStatus.RUNNING,
      attempts: job.attempts + 1,
      lastError: null,
    },
  });

  try {
    const result = await runCompletion(running.productId, undefined, opts);
    await syncLicenseAfterCompletion(running.productId, result);
    await prisma.completionJob.update({
      where: { id: jobId },
      data: {
        status: CompletionJobStatus.COMPLETED,
        lastError: null,
        certificateId: result.certId,
      },
    });
    return result;
  } catch (err: any) {
    await prisma.completionJob.update({
      where: { id: jobId },
      data: {
        status: CompletionJobStatus.FAILED,
        lastError: stringifyError(err),
      },
    });
    throw err;
  }
}

async function runCompletion(productId: string, message?: string, opts?: { force?: boolean }): Promise<CompletionResult> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { user: true, certificate: true, orders: true, license: true },
  });
  if (!product) throw new CompletionError('PRODUCT_NOT_FOUND', 404);
  if (product.status === 'COMPLETED' && !opts?.force) {
    throw new CompletionError('ALREADY_COMPLETED', 409);
  }
  const allowedStatuses = opts?.force ? ['PAID', 'IN_REVIEW', 'COMPLETED'] : ['PAID', 'IN_REVIEW'];
  if (!allowedStatuses.includes(product.status)) {
    throw new CompletionError('INVALID_STATUS', 400);
  }
  if (product.paymentStatus !== 'PAID' && product.paymentStatus !== 'MANUAL') {
    throw new CompletionError('PRECHECK_NOT_PAID', 400);
  }

  const hasPaidLicenseOrder = product.orders.some(
    (o) =>
      Boolean(o.paidAt) &&
      (o.plan === 'BASIC' || o.plan === 'PREMIUM' || o.plan === 'LIFETIME'),
  );
  const hasPaidLicense =
    (Boolean(product.license?.paidAt) || product.license?.status === 'ACTIVE') &&
    (product.license?.plan === 'BASIC' || product.license?.plan === 'PREMIUM' || product.license?.plan === 'LIFETIME');
  if (!hasPaidLicenseOrder && !hasPaidLicense) {
    throw new CompletionError('LICENSE_NOT_PAID', 400);
  }

  const reportUrl = product.certificate?.reportUrl ?? null;
  if (!reportUrl) {
    throw new CompletionError('REPORT_MISSING', 400);
  }

  const rating = await fetchStoredRatingPdfAttachment(product.id);
  if (!rating?.buffer) throw new CompletionError('RATING_PDF_MISSING', 400);
  const lockState = await getRatingLockState(product.id);
  if (!lockState.passEmailSentAt || !lockState.lockedAt) {
    throw new CompletionError('RATING_NOT_LOCKED', 400);
  }

  const signedReportUrl = (await ensureSignedS3Url(reportUrl)) ?? reportUrl;
  const reportBuffer = await fetchBufferFromUrl(signedReportUrl);
  if (!reportBuffer) {
    throw new CompletionError('REPORT_FETCH_FAILED', 502, { reportUrl });
  }

  let certificateRecord = product.certificate;
  let seal = product.certificate?.seal_number ?? '';
  if (!certificateRecord) {
    const created = await allocateCertificateWithSeal(product.id);
    certificateRecord = created.certificate;
    seal = created.seal;
  }
  const certificateId = certificateRecord.id;
  const verifyUrl = `${APP_URL.replace(/\/$/, '')}/lizenzen?q=${encodeURIComponent(certificateId)}`;
  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    margin: 1,
    width: 512,
    color: { dark: '#000000', light: '#0000' }, // transparent background
  });
  const qrDataUrl = `data:image/png;base64,${qrBuffer.toString('base64')}`;

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
      status: 'PASS',
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
    qrUrl: qrDataUrl,
  });

  const { pdfSigned, qrSigned } = await storeCertificateAssets({
    certificateId,
    productId: product.id,
    userId: product.userId,
    sealNumber: seal,
    pdfBuffer,
    qrBuffer,
  });

  let cert = await prisma.certificate.upsert({
    where: { productId: product.id },
    update: {
      pdfUrl: pdfSigned,
      qrUrl: qrSigned,
      seal_number: seal,
      externalReferenceId: null,
    },
    create: {
      productId: product.id,
      pdfUrl: pdfSigned,
      qrUrl: qrSigned,
      seal_number: seal,
      externalReferenceId: null,
    },
  });

  // Ensure seal image exists and load it (S3-backed)
  let sealBuffer: Buffer | undefined;
  let sealUrl = cert.sealUrl || product.certificate?.sealUrl || null;
  if (!sealUrl) {
    try {
      const seal = await generateSealForS3({
        product: { id: product.id, name: product.name, brand: product.brand, createdAt: product.createdAt },
        certificateId: cert.id,
        tcCode: product.processNumber ?? undefined,
        ratingScore: cert.ratingScore ?? 'PASS',
        ratingLabel: cert.ratingLabel ?? 'PASS',
        appUrl: APP_URL,
        licenseDate: product.license?.startsAt ?? product.license?.paidAt ?? product.license?.createdAt ?? null,
      });
      await saveBufferToS3({ key: seal.key, body: seal.buffer, contentType: 'image/png' });
      sealUrl = seal.key;
      sealBuffer = seal.buffer;
      await prisma.asset.upsert({
        where: { key: seal.key },
        update: {
          type: AssetType.SEAL_IMAGE,
          contentType: 'image/png',
          sizeBytes: seal.buffer.length,
          certificateId: cert.id,
          productId: product.id,
          userId: product.userId,
        },
        create: {
          key: seal.key,
          type: AssetType.SEAL_IMAGE,
          contentType: 'image/png',
          sizeBytes: seal.buffer.length,
          certificateId: cert.id,
          productId: product.id,
          userId: product.userId,
        },
      });
      cert = await prisma.certificate.update({
        where: { id: cert.id },
        data: { sealUrl },
      });
    } catch (err) {
      console.warn('SEAL_GENERATION_FAILED', err);
    }
  }
  if (sealUrl && !sealBuffer) {
    sealBuffer = await fetchSealBufferFromS3(sealUrl) ?? undefined;
    if (!sealBuffer) {
      // Fallback: regenerate and upload if the existing seal is missing/inaccessible
      try {
        const seal = await generateSealForS3({
          product: { id: product.id, name: product.name, brand: product.brand, createdAt: product.createdAt },
          certificateId: cert.id,
          tcCode: product.processNumber ?? undefined,
          ratingScore: cert.ratingScore ?? 'PASS',
          ratingLabel: cert.ratingLabel ?? 'PASS',
          appUrl: APP_URL,
          licenseDate: product.license?.startsAt ?? product.license?.paidAt ?? product.license?.createdAt ?? null,
        });
        await saveBufferToS3({ key: seal.key, body: seal.buffer, contentType: 'image/png' });
        sealUrl = seal.key;
        sealBuffer = seal.buffer;
        await prisma.asset.upsert({
          where: { key: seal.key },
          update: {
            type: AssetType.SEAL_IMAGE,
            contentType: 'image/png',
            sizeBytes: seal.buffer.length,
            certificateId: cert.id,
            productId: product.id,
            userId: product.userId,
          },
          create: {
            key: seal.key,
            type: AssetType.SEAL_IMAGE,
            contentType: 'image/png',
            sizeBytes: seal.buffer.length,
            certificateId: cert.id,
            productId: product.id,
            userId: product.userId,
          },
        });
        await prisma.certificate.update({
          where: { id: cert.id },
          data: { sealUrl },
        });
      } catch (err) {
        console.warn('SEAL_REGENERATE_FAILED', { sealUrl, err });
      }
    }
  }
  if (!sealBuffer) {
    throw new CompletionError('SEAL_MISSING', 500, { sealUrl });
  }

  await prisma.product.update({
    where: { id: product.id },
    data: { status: 'COMPLETED', adminProgress: 'COMPLETION' },
  });

  // Build invoice lines (best-effort)
  const invoiceLines: InvoiceLine[] = [];
  if (product.paymentStatus === 'PAID' || product.paymentStatus === 'MANUAL') {
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
	    pdfUrl: pdfSigned,
	    qrUrl: qrSigned,
	    certificateBuffer: pdfBuffer,
	    reportBuffer,
	    documentId: undefined,
	    message,
	    sealNumber: seal,
	    ratingPdfBuffer: rating.buffer,
	    sealBuffer,
	    invoiceBuffer,
	  });

  return {
    verifyUrl,
    certId: cert.id,
    pdfUrl: pdfSigned,
    qrUrl: qrSigned,
    seal,
  };
}

async function fetchSealBufferFromS3(sealUrl: string) {
  try {
    const isHttp = /^https?:\/\//i.test(sealUrl);
    const url = isHttp ? sealUrl : await signedUrlForKey(sealUrl);
    const res = await fetch(url);
    if (!res.ok) return null;
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  } catch (err) {
    console.warn('SEAL_FETCH_FAILED', { sealUrl, err });
    return null;
  }
}

async function fetchBufferFromUrl(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  } catch (err) {
    console.warn('FETCH_BUFFER_FAILED', { url, err });
    return null;
  }
}

function makeSealNumber() {
  return `DPI-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

async function allocateCertificateWithSeal(productId: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const seal = makeSealNumber();
    try {
      const certificate = await prisma.certificate.create({
        data: { productId, pdfUrl: '', qrUrl: '', seal_number: seal },
      });
      return { certificate, seal };
    } catch (err: any) {
      if (err?.code === 'P2002') continue; // unique constraint collision, retry
      throw err;
    }
  }
  throw new CompletionError('SEAL_GENERATION_FAILED', 500);
}

function stringifyError(err: any) {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err.slice(0, 500);
  if (err instanceof Error) return err.message.slice(0, 500);
  try {
    return JSON.stringify(err).slice(0, 500);
  } catch {
    return String(err).slice(0, 500);
  }
}

async function syncLicenseAfterCompletion(productId: string, result: CompletionResult) {
  const existingLicense = await prisma.license.findUnique({ where: { productId } });
  if (!existingLicense) {
    console.warn('SYNC_LICENSE_NO_LICENSE', { productId });
    return;
  }

  const now = new Date();
  await prisma.license.update({
    where: { productId },
    data: {
      status: 'ACTIVE',
      licenseCode: result.seal,
      certificateId: result.certId,
      startsAt: existingLicense.startsAt ?? now,
      paidAt: existingLicense.paidAt ?? now,
    },
  });
}
