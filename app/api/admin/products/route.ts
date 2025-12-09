import { NextResponse } from 'next/server';
import { Prisma, AdminRole } from '@prisma/client';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { ensureSignedS3Url } from '@/lib/s3';
import { getCertificateAssetLinks } from '@/lib/certificateAssets';
import { ensureProcessNumber } from '@/lib/processNumber';

export const runtime = 'nodejs';

export async function GET() {
  const admin = await requireAdmin(AdminRole.VIEWER).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const isViewerOnly = admin.role === AdminRole.VIEWER;

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
      select: {
        id: true,
        name: true,
        brand: true,
        category: true,
        code: true,
        specs: true,
        size: true,
        madeIn: true,
        material: true,
        status: true,
        processNumber: true,
        adminProgress: true,
        paymentStatus: true,
        createdAt: true,
        user: { select: { name: true, company: true, email: true, address: true } },
        certificate: {
          select: {
            id: true,
            pdfUrl: true,
            reportUrl: true,
            qrUrl: true,
            seal_number: true,
            externalReferenceId: true,
            ratingScore: true,
            ratingLabel: true,
            sealUrl: true,
          },
        },
        license: {
          select: {
            id: true,
            plan: true,
            status: true,
            licenseCode: true,
            startsAt: true,
            expiresAt: true,
            paidAt: true,
            stripeSubId: true,
            stripePriceId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const payload = await Promise.all(
      products.map(async (product) => {
        const processNumber = product.processNumber ?? (await ensureProcessNumber(product.id));
        if (isViewerOnly) {
          return {
            id: product.id,
            name: product.name,
            brand: product.brand,
            category: product.category,
            status: product.status,
            adminProgress: product.adminProgress,
            paymentStatus: product.paymentStatus,
            createdAt: product.createdAt.toISOString(),
            processNumber,
            user: {
              name: product.user.name,
              company: product.user.company,
              email: product.user.email,
              address: product.user.address,
            },
            certificate: null,
            license: null,
          };
        }

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
          processNumber,
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
