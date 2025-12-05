import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';
import { getCertificateAssetLinks } from '@/lib/certificateAssets';
import { ensureSignedS3Url } from '@/lib/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { userId: session.userId },
    include: {
      certificate: true,
      license: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const payload = await Promise.all(
    products.map(async (p) => {
      const assets = p.certificate ? await getCertificateAssetLinks(p.certificate.id) : null;
      const pdfUrl =
        assets?.OFFICIAL_PDF ??
        (p.certificate?.pdfUrl ? await ensureSignedS3Url(p.certificate.pdfUrl) : null);
      const qrUrl =
        assets?.CERTIFICATE_QR ??
        (p.certificate?.qrUrl ? await ensureSignedS3Url(p.certificate.qrUrl) : null);

      return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        status: p.status,
        adminProgress: p.adminProgress,
        paymentStatus: p.paymentStatus,
        createdAt: p.createdAt,
        certificate: p.certificate
          ? {
              id: p.certificate.id,
              pdfUrl,
              qrUrl,
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
