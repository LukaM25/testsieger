import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { productId: string } }
) {
  const productId = params.productId;
  if (!productId) {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { certificate: true },
  });

  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const certificate = product.certificate;

  return NextResponse.json({
    productStatus: product.status,
    adminProgress: product.adminProgress,
    certificateStatus: certificate?.status ?? null,
    certificateId: certificate?.id ?? null,
    pdfUrl: certificate?.pdfUrl ?? null,
    sealUrl: certificate?.sealUrl ?? null,
  });
}
