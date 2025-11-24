import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { productId } = await req.json();

    if (!productId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { certificate: true }
    });

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    // If cert exists, return its ID. If not, create a PENDING one.
    if (product.certificate) {
      return NextResponse.json({ certificateId: product.certificate.id });
    }

    const newCert = await prisma.certificate.create({
      data: {
        productId: product.id,
        status: 'PENDING',
        externalReferenceId: `DRAFT-${Date.now()}`,
        pdfUrl: '',
        qrUrl: '',
      }
    });

    return NextResponse.json({ certificateId: newCert.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to ensure cert' }, { status: 500 });
  }
}