import { NextResponse } from 'next/server';
import { AdminRole, Plan } from '@prisma/client';

import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { ensureSignedS3Url } from '@/lib/s3';
import { getCertificateAssetLinks } from '@/lib/certificateAssets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(AdminRole.VIEWER).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const isViewerOnly = admin.role === AdminRole.VIEWER;

  const { id: productId } = await params;
  if (!productId) return NextResponse.json({ error: 'MISSING_PRODUCT_ID' }, { status: 400 });

  const url = new URL(req.url);
  const signed = (url.searchParams.get('signed') || '').trim() !== '0';

  const product = await prisma.product.findUnique({
    where: { id: productId },
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
      certificate: isViewerOnly
        ? undefined
        : {
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
      license: isViewerOnly
        ? undefined
        : {
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
  });
  if (!product) return NextResponse.json({ error: 'PRODUCT_NOT_FOUND' }, { status: 404 });

  const paidLicenseOrder =
    !isViewerOnly
      ? await prisma.order.findFirst({
          where: {
            productId,
            paidAt: { not: null },
            plan: { in: [Plan.BASIC, Plan.PREMIUM, Plan.LIFETIME] },
          },
          select: { id: true },
        })
      : null;
  const licensePaid =
    Boolean(paidLicenseOrder) || Boolean(product.license?.paidAt) || product.license?.status === 'ACTIVE';

  if (isViewerOnly) {
    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        status: product.status,
        adminProgress: product.adminProgress,
        paymentStatus: product.paymentStatus,
        licensePaid,
        createdAt: product.createdAt.toISOString(),
        processNumber: product.processNumber ?? null,
        user: {
          name: product.user.name,
          company: product.user.company,
          email: product.user.email,
          address: product.user.address,
        },
        certificate: null,
        license: null,
      },
    });
  }

  const assets = signed && product.certificate?.id ? await getCertificateAssetLinks(product.certificate.id) : null;

  const pdfUrl = signed
    ? assets?.OFFICIAL_PDF ?? (product.certificate ? await ensureSignedS3Url(product.certificate.pdfUrl) : null)
    : (product.certificate?.pdfUrl ?? null);

  const reportUrl = signed
    ? assets?.UPLOADED_PDF ?? (product.certificate?.reportUrl ? await ensureSignedS3Url(product.certificate.reportUrl) : null)
    : (product.certificate?.reportUrl ?? null);

  const qrUrl = signed
    ? assets?.CERTIFICATE_QR ?? (product.certificate?.qrUrl ? await ensureSignedS3Url(product.certificate.qrUrl) : null)
    : (product.certificate?.qrUrl ?? null);

  const sealUrl = signed
    ? assets?.SEAL_IMAGE ?? (product.certificate?.sealUrl ? await ensureSignedS3Url(product.certificate.sealUrl) : null)
    : (product.certificate?.sealUrl ?? null);

  return NextResponse.json({
    product: {
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
      licensePaid,
      createdAt: product.createdAt.toISOString(),
      processNumber: product.processNumber ?? null,
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
            sealUrl,
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
    },
  });
}
