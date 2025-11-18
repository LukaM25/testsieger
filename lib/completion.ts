import path from 'path';
import { promises as fs } from 'fs';
import QRCode from 'qrcode';
import { createPdfDocument, getDocumentCard } from '@/lib/pdfmonkey';
import { prisma } from '@/lib/prisma';
import { sendCompletionEmail } from '@/lib/email';

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

type PdfMonkeyPayload = {
  product: {
    id: string;
    name: string;
    brand: string;
    code?: string | null;
    specs?: string | null;
    size?: string | null;
    made_in?: string | null;
    material?: string | null;
  };
  user: {
    name: string;
    company?: string | null;
    email: string;
    address?: string | null;
  };
  standard: string;
  date: string;
  seal_number: string;
  verify_url: string;
  qr_data: string;
};

/**
 * Creates the certificate PDF, stores the assets, marks the product completed and emails the customer.
 */
export async function completeProduct(productId: string): Promise<CompletionResult> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { user: true, certificate: true },
  });
  if (!product) throw new CompletionError('PRODUCT_NOT_FOUND', 404);
  if (!['PAID', 'IN_REVIEW'].includes(product.status)) {
    throw new CompletionError('INVALID_STATUS', 400);
  }

  const seal = product.certificate?.seal_number ?? (await generateSeal());
  const verifyUrl = `${APP_URL}/testergebnisse?productId=${product.id}`;
  const qrBuffer = await QRCode.toBuffer(verifyUrl, { margin: 1, width: 512 });
  const qrData = `data:image/png;base64,${qrBuffer.toString('base64')}`;

  const payload: PdfMonkeyPayload = {
    product: {
      id: product.id,
      name: product.name,
      brand: product.brand,
      code: product.code ?? null,
      specs: product.specs ?? null,
      size: product.size ?? null,
      made_in: product.madeIn ?? null,
      material: product.material ?? null,
    },
    user: {
      name: product.user.name,
      email: product.user.email,
      address: product.user.address ?? null,
      company: product.user.company ?? null,
    },
    standard: 'Prüfsiegel Zentrum UG Standard 2025',
    date: new Date().toISOString().slice(0, 10),
    seal_number: seal,
    verify_url: verifyUrl,
    qr_data: qrData,
  };

  const created = await createPdfDocument(payload);
  let card = created;

  const start = Date.now();
  while (card.status !== 'success') {
    if (card.status === 'failure') {
      throw new CompletionError('PDF_GENERATION_FAILED', 500);
    }
    if (Date.now() - start > 20000) break;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    card = await getDocumentCard(created.id);
  }

  if (card.status !== 'success' || !card.downloadUrl) {
    await prisma.certificate.upsert({
      where: { productId: product.id },
      update: {
        pdfUrl: '',
        qrUrl: '',
        seal_number: seal,
        pdfmonkeyDocumentId: created.id,
      },
      create: {
        productId: product.id,
        pdfUrl: '',
        qrUrl: '',
        seal_number: seal,
        pdfmonkeyDocumentId: created.id,
      },
    });
    throw new CompletionError('PDF_NOT_READY_YET', 202, { document_id: created.id });
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const qrDir = path.join(process.cwd(), 'public', 'qr');
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.mkdir(qrDir, { recursive: true });

  const pdfResp = await fetch(card.downloadUrl);
  if (!pdfResp.ok) {
    throw new CompletionError('PDF_DOWNLOAD_FAILED', 500);
  }
  const pdfBuf = Buffer.from(await pdfResp.arrayBuffer());
  const pdfRel = `/uploads/REPORT_${seal}.pdf`;
  const pdfAbs = path.join(uploadsDir, `REPORT_${seal}.pdf`);
  await fs.writeFile(pdfAbs, pdfBuf);

  const qrRel = `/qr/${seal}.png`;
  const qrAbs = path.join(qrDir, `${seal}.png`);
  await fs.writeFile(qrAbs, qrBuffer);

  const cert = await prisma.certificate.upsert({
    where: { productId: product.id },
    update: {
      pdfUrl: pdfRel,
      qrUrl: qrRel,
      seal_number: seal,
      pdfmonkeyDocumentId: created.id,
    },
    create: {
      productId: product.id,
      pdfUrl: pdfRel,
      qrUrl: qrRel,
      seal_number: seal,
      pdfmonkeyDocumentId: created.id,
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
    pdfBuffer: pdfBuf,
    documentId: created.id,
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
