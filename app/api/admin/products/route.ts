import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { isAdminAuthed } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { ensureSignedS3Url } from '@/lib/s3';
import { getCertificateAssetLinks } from '@/lib/certificateAssets';

export const runtime = 'nodejs';

export async function GET() {
  const authed = await isAdminAuthed();
  if (!authed) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  // Optional bypass for offline dev or unreachable DB
  if (process.env.ADMIN_DB_BYPASS === 'true') {
    return NextResponse.json(
      {
        products: [],
        warning:
          'Datenbank-Zugriff ist deaktiviert (ADMIN_DB_BYPASS). Liste bleibt leer, bitte später erneut versuchen.',
      },
      { status: 200 },
    );
  }

  // Early connectivity check to avoid bubbling Prisma init errors
  try {
    await prisma.$connect();
  } catch (err) {
    console.error('Prisma connection failed before query', err);
    return NextResponse.json(
      {
        products: [],
        warning:
          'Datenbank aktuell nicht erreichbar. Die Liste ist leer, bitte später erneut versuchen.',
      },
      { status: 200 },
    );
  }

  try {
    const products = await prisma.product.findMany({
      include: {
        user: true,
        certificate: true,
        license: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const payload = await Promise.all(
      products.map(async (product) => {
        const assets = product.certificate
          ? await getCertificateAssetLinks(product.certificate.id)
          : null;

        const pdfUrl =
          assets?.OFFICIAL_PDF ??
          (product.certificate ? await ensureSignedS3Url(product.certificate.pdfUrl) : null);
        const reportUrl =
          assets?.UPLOADED_PDF ??
          (product.certificate?.reportUrl ? await ensureSignedS3Url(product.certificate.reportUrl) : null);
        const qrUrl =
          assets?.CERTIFICATE_QR ??
          (product.certificate?.qrUrl ? await ensureSignedS3Url(product.certificate.qrUrl) : null);

        return {
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
                pdfUrl,
                reportUrl,
                qrUrl,
                seal_number: product.certificate.seal_number,
                externalReferenceId: product.certificate.externalReferenceId,
                ratingScore: product.certificate.ratingScore,
                ratingLabel: product.certificate.ratingLabel,
                sealUrl: product.certificate.sealUrl,
              }
            : null,
          license: product.license
            ? {
                id: product.license.id,
                plan: product.license.plan,
                status: product.license.status,
                licenseCode: product.license.licenseCode,
                startsAt: product.license.startsAt.toISOString(),
                expiresAt: product.license.expiresAt ? product.license.expiresAt.toISOString() : null,
                paidAt: product.license.paidAt ? product.license.paidAt.toISOString() : null,
                stripeSubId: product.license.stripeSubId,
                stripePriceId: product.license.stripePriceId,
              }
            : null,
        };
      }),
    );

    return NextResponse.json({ products: payload });
  } catch (error) {
    console.error('Failed to load products from database', error);
    // Gracefully degrade for any failure: return empty list with warning.
    return NextResponse.json(
      {
        products: [],
        warning:
          'Datenbank aktuell nicht erreichbar. Die Liste ist leer, bitte später erneut versuchen.',
      },
      { status: 200 },
    );
  }
}
