import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';
import { getCertificateAssetLinks } from '@/lib/certificateAssets';
import { ensureSignedS3Url } from '@/lib/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { productId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const productId = params.productId;
  if (!productId) {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId, userId: session.userId },
    select: {
      status: true,
      adminProgress: true,
      certificate: {
        select: {
          id: true,
          status: true,
          pdfUrl: true,
          reportUrl: true,
          sealUrl: true,
        },
      },
    },
  });

  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const certificate = product.certificate;
  const assets = certificate?.id ? await getCertificateAssetLinks(certificate.id) : null;
  const pdfUrl =
    assets?.OFFICIAL_PDF ??
    (certificate?.pdfUrl ? await ensureSignedS3Url(certificate.pdfUrl) : null);
  const reportUrl =
    assets?.UPLOADED_PDF ??
    (certificate?.reportUrl ? await ensureSignedS3Url(certificate.reportUrl) : null);
  const sealUrl =
    assets?.SEAL_IMAGE ??
    (certificate?.sealUrl ? await ensureSignedS3Url(certificate.sealUrl) : null);

  return NextResponse.json({
    productStatus: product.status,
    adminProgress: product.adminProgress,
    certificateStatus: certificate?.status ?? null,
    certificateId: certificate?.id ?? null,
    pdfUrl,
    reportUrl,
    sealUrl,
  });
}
