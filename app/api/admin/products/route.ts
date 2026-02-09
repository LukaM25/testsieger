import { NextResponse } from 'next/server';
import { AdminProgress, AdminRole, PaymentStatus, Plan, Prisma, ProductStatus } from '@prisma/client';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { ensureSignedS3Url } from '@/lib/s3';
import { getCertificateAssetLinks } from '@/lib/certificateAssets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_PROGRESS_VALUES = new Set<string>(Object.values(AdminProgress));
const PRODUCT_STATUS_VALUES = new Set<string>(Object.values(ProductStatus));
const PAYMENT_STATUS_VALUES = new Set<string>(Object.values(PaymentStatus));

function parseLimit(raw: string | null): number {
  const parsed = raw ? Number.parseInt(raw, 10) : 50;
  if (!Number.isFinite(parsed)) return 50;
  return Math.max(1, Math.min(100, parsed));
}

export async function GET(request: Request) {
  const admin = await requireAdmin(AdminRole.VIEWER).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const isViewerOnly = admin.role === AdminRole.VIEWER;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const status = (searchParams.get('status') || '').trim();
  const payment = (searchParams.get('payment') || '').trim();
  const cursor = (searchParams.get('cursor') || '').trim();
  const limit = parseLimit(searchParams.get('limit'));
  const signed = (searchParams.get('signed') || '').trim() !== '0';

  // Optional bypass for offline dev or unreachable DB
  if (process.env.ADMIN_DB_BYPASS === 'true') {
    return NextResponse.json(
      {
        products: [],
        total: 0,
        statusCounts: {},
        nextCursor: null,
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
        total: 0,
        statusCounts: {},
        nextCursor: null,
        warning:
          'Datenbank aktuell nicht erreichbar. Die Liste ist leer, bitte später erneut versuchen.',
      },
      { status: 200 },
    );
  }

  try {
    const and: Prisma.ProductWhereInput[] = [];
    if (q) {
      const contains = { contains: q, mode: 'insensitive' as const };
      and.push({
        OR: [
          { name: contains },
          { brand: contains },
          { category: contains },
          { code: contains },
          { processNumber: contains },
          { user: { is: { email: contains } } },
          { user: { is: { name: contains } } },
          { user: { is: { company: contains } } },
        ],
      });
    }
    if (status) {
      const statusOr: Prisma.ProductWhereInput[] = [];
      if (ADMIN_PROGRESS_VALUES.has(status)) statusOr.push({ adminProgress: status as AdminProgress });
      if (PRODUCT_STATUS_VALUES.has(status)) statusOr.push({ status: status as ProductStatus });
      if (statusOr.length) and.push({ OR: statusOr });
    }
    if (payment) {
      if (PAYMENT_STATUS_VALUES.has(payment)) {
        and.push({ paymentStatus: payment as PaymentStatus });
      }
    }

    const where: Prisma.ProductWhereInput = and.length ? { AND: and } : {};

    const [rawProducts, total, groupedStatusCounts] = await Promise.all([
      prisma.product.findMany({
        where,
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
          user: { select: { name: true, gender: true, company: true, email: true, address: true } },
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
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      prisma.product.count({ where }),
      prisma.product.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
    ]);

    const hasMore = rawProducts.length > limit;
    const pageProducts = hasMore ? rawProducts.slice(0, limit) : rawProducts;
    const nextCursor = hasMore ? pageProducts[pageProducts.length - 1]?.id ?? null : null;

    const statusCounts = groupedStatusCounts.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    }, {});

    const paidLicenseOrderProductIds = new Set<string>();
    const baseFeePlanByProductId = new Map<string, Plan>();
    const passEmailSentByProductId = new Set<string>();
    if (pageProducts.length > 0) {
      const productIds = pageProducts.map((product) => product.id);
      if (!isViewerOnly) {
        const paidLicenseOrders = await prisma.order.findMany({
          where: {
            productId: { in: productIds },
            paidAt: { not: null },
            plan: { in: [Plan.BASIC, Plan.PREMIUM, Plan.LIFETIME] },
          },
          select: { productId: true },
        });
        paidLicenseOrders.forEach((order) => paidLicenseOrderProductIds.add(order.productId));
      }

      const baseFeeOrders = await prisma.order.findMany({
        where: {
          productId: { in: productIds },
          paidAt: { not: null },
          plan: { in: [Plan.PRECHECK_FEE, Plan.PRECHECK_PRIORITY] },
        },
        select: { productId: true, plan: true },
      });
      baseFeeOrders.forEach((order) => {
        const existing = baseFeePlanByProductId.get(order.productId);
        if (order.plan === Plan.PRECHECK_PRIORITY) {
          baseFeePlanByProductId.set(order.productId, order.plan);
          return;
        }
        if (!existing) {
          baseFeePlanByProductId.set(order.productId, order.plan);
        }
      });

      const passEmailAudits = await prisma.adminAudit.findMany({
        where: {
          productId: { in: productIds },
          action: 'SEND_LICENSE_PLANS_EMAIL',
        },
        select: { productId: true },
        distinct: ['productId'],
      });
      passEmailAudits.forEach((audit) => {
        if (audit.productId) passEmailSentByProductId.add(audit.productId);
      });
    }

    const payload = await Promise.all(
      pageProducts.map(async (product) => {
        const processNumber = product.processNumber ?? null;
        const licensePaid =
          paidLicenseOrderProductIds.has(product.id) ||
          Boolean(product.license?.paidAt) ||
          product.license?.status === 'ACTIVE';
        const baseFeePlan = baseFeePlanByProductId.get(product.id) ?? null;
        const passEmailSent = passEmailSentByProductId.has(product.id);
        if (isViewerOnly) {
          return {
            id: product.id,
            name: product.name,
            brand: product.brand,
            category: product.category,
            status: product.status,
            adminProgress: product.adminProgress,
            paymentStatus: product.paymentStatus,
            baseFeePlan,
            licensePaid,
            passEmailSent,
            createdAt: product.createdAt.toISOString(),
            processNumber,
            user: {
              name: product.user.name,
              gender: product.user.gender,
              company: product.user.company,
              email: product.user.email,
              address: product.user.address,
            },
            certificate: null,
            license: null,
          };
        }

        const assets =
          signed && product.certificate?.id ? await getCertificateAssetLinks(product.certificate.id) : null;

        const pdfUrl = signed
          ? assets?.OFFICIAL_PDF ?? (product.certificate ? await ensureSignedS3Url(product.certificate.pdfUrl) : null)
          : (product.certificate?.pdfUrl ?? null);

        const reportUrl = signed
          ? assets?.UPLOADED_PDF ??
            (product.certificate?.reportUrl ? await ensureSignedS3Url(product.certificate.reportUrl) : null)
          : (product.certificate?.reportUrl ?? null);

        const qrUrl = signed
          ? assets?.CERTIFICATE_QR ?? (product.certificate?.qrUrl ? await ensureSignedS3Url(product.certificate.qrUrl) : null)
          : (product.certificate?.qrUrl ?? null);

        const sealUrl = signed
          ? assets?.SEAL_IMAGE ?? (product.certificate?.sealUrl ? await ensureSignedS3Url(product.certificate.sealUrl) : null)
          : (product.certificate?.sealUrl ?? null);

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
          baseFeePlan,
          licensePaid,
          passEmailSent,
          createdAt: product.createdAt.toISOString(),
          processNumber,
          user: {
            name: product.user.name,
            gender: product.user.gender,
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
        };
      }),
    );

    return NextResponse.json({ products: payload, total, statusCounts, nextCursor });
  } catch (error) {
    console.error('Failed to load products from database', error);
    // Gracefully degrade for any failure: return empty list with warning.
    return NextResponse.json(
      {
        products: [],
        total: 0,
        statusCounts: {},
        nextCursor: null,
        warning:
          'Datenbank aktuell nicht erreichbar. Die Liste ist leer, bitte später erneut versuchen.',
      },
      { status: 200 },
    );
  }
}
