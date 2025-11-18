'use server';

import { prisma } from '@/lib/prisma';
import { createPdfDocument, getDocumentCard } from '@/lib/pdfmonkey';
import type { PdfMonkeyDoc } from '@/lib/pdfmonkey';
import QRCode from 'qrcode';
import { revalidatePath } from 'next/cache';

export async function complete(formData: FormData) {
  const productId = String(formData.get('productId') || '');
  if (!productId) return;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { user: true },
  });
  if (!product) return;

  // Generate PDF via PDFMonkey
  const doc = await createPdfDocument({
    product: { name: product.name, brand: product.brand },
    user: { name: product.user.name, email: product.user.email },
  });
  if (!doc.id) return;

  // Poll for the document card (max ~20s)
  const start = Date.now();
  let card: PdfMonkeyDoc | null = null;
  while (Date.now() - start < 20000) {
    const c = await getDocumentCard(doc.id);
    if (c.status === 'success' && c.downloadUrl) {
      card = c;
      break;
    }
    if (c.status === 'failure') {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!card) return;

  // QR for public verify page
  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify/${product.id}`;
  const qrUrl = await QRCode.toDataURL(verifyUrl);

  // Save certificate + update status
  await prisma.certificate.upsert({
    where: { productId: product.id },
    update: { pdfUrl: card.downloadUrl || '', qrUrl, pdfmonkeyDocumentId: doc.id },
    create: {
      productId: product.id,
      pdfUrl: card.downloadUrl || '',
      qrUrl,
      pdfmonkeyDocumentId: doc.id,
    },
  });
  await prisma.product.update({
    where: { id: product.id },
    data: { status: 'COMPLETED' },
  });

  // Refresh the admin page
  revalidatePath('/admin');
}
