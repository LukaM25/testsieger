import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getCertificateAssetLinks } from '@/lib/certificateAssets';
import { ensureSignedS3Url } from '@/lib/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { userId: session.userId },
    select: {
      id: true,
      name: true,
      brand: true,
      status: true,
      adminProgress: true,
      paymentStatus: true,
      createdAt: true,
      certificate: {
        select: { id: true, status: true, pdfUrl: true, qrUrl: true, reportUrl: true, sealUrl: true },
      },
      license: { select: { status: true, plan: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const productsByCreatedAt = [...products].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const discountByProductId = new Map<string, number>();
  productsByCreatedAt.forEach((p, index) => {
    const orderIndex = index + 1;
    const tierDiscount = orderIndex <= 1 ? 0 : orderIndex === 2 ? 20 : 30;
    const discount = p.paymentStatus === 'PAID' || p.paymentStatus === 'MANUAL' ? 0 : tierDiscount;
    discountByProductId.set(p.id, discount);
  });

  const payload = await Promise.all(
    products.map(async (p) => {
      const lastPayment = await prisma.order.findFirst({
        where: { productId: p.id, paidAt: { not: null } },
        orderBy: { paidAt: 'desc' },
        select: { paidAt: true },
      });
      const assets = p.certificate ? await getCertificateAssetLinks(p.certificate.id) : null;
      const pdfUrl =
        assets?.OFFICIAL_PDF ??
        (p.certificate?.pdfUrl ? await ensureSignedS3Url(p.certificate.pdfUrl) : null);
      const reportUrl =
        assets?.UPLOADED_PDF ??
        (p.certificate?.reportUrl ? await ensureSignedS3Url(p.certificate.reportUrl) : null);
      const qrUrl =
        assets?.CERTIFICATE_QR ??
        (p.certificate?.qrUrl ? await ensureSignedS3Url(p.certificate.qrUrl) : null);
      const sealUrl =
        assets?.SEAL_IMAGE ??
        (p.certificate?.sealUrl ? await ensureSignedS3Url(p.certificate.sealUrl) : null);

      return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        status: p.status,
        adminProgress: p.adminProgress,
        paymentStatus: p.paymentStatus,
        createdAt: p.createdAt,
        paidAt: lastPayment?.paidAt ?? null,
        precheckDiscountPercent: discountByProductId.get(p.id) ?? 0,
        certificate: p.certificate
          ? {
              id: p.certificate.id,
              status: p.certificate.status ?? null,
              pdfUrl,
              reportUrl,
              qrUrl,
              sealUrl,
            }
          : null,
        license: p.license
          ? {
              status: p.license.status,
              plan: p.license.plan,
            }
          : null,
      };
    }),
  );

  return NextResponse.json({
    ok: true,
    products: payload,
  });
}
