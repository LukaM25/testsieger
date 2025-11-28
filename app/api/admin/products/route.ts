import { NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  const authed = await isAdminAuthed();
  if (!authed) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const products = await prisma.product.findMany({
    include: {
      user: true,
      certificate: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const payload = products.map((product) => ({
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    code: product.code,
    specs: product.specs,
    size: product.size,
    madeIn: product.madeIn,
    material: product.material,
    status: product.status,
    adminProgress: product.adminProgress,
    paymentStatus: product.paymentStatus,
    createdAt: product.createdAt.toISOString(),
    user: {
      name: product.user.name,
      company: product.user.company,
      email: product.user.email,
      address: product.user.address,
    },
    certificate: product.certificate
      ? {
          id: product.certificate.id,
          pdfUrl: product.certificate.pdfUrl,
          qrUrl: product.certificate.qrUrl,
          seal_number: product.certificate.seal_number,
          externalReferenceId: product.certificate.externalReferenceId,
          ratingScore: product.certificate.ratingScore,
          ratingLabel: product.certificate.ratingLabel,
          sealUrl: product.certificate.sealUrl,
        }
      : null,
  }));

  return NextResponse.json({ products: payload });
}
