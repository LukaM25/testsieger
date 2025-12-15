import { NextResponse } from 'next/server';
import { Plan, LicenseStatus, AdminRole } from '@prisma/client';
import { logAdminAudit, requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const PLAN_DURATIONS: Record<Plan, number | null> = {
  BASIC: 365,
  PREMIUM: 365,
  LIFETIME: null,
};

export async function POST(req: Request) {
  const admin = await requireAdmin(AdminRole.SUPERADMIN).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { productId, plan, status, startsAt, expiresAt, licenseCode } = body as {
    productId?: string;
    plan?: Plan;
    status?: LicenseStatus;
    startsAt?: string;
    expiresAt?: string | null;
    licenseCode?: string;
  };

  if (!productId || !plan || !status) {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
  }
  if (!['BASIC', 'PREMIUM', 'LIFETIME'].includes(plan)) {
    return NextResponse.json({ error: 'INVALID_PLAN' }, { status: 400 });
  }
  if (!['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELED'].includes(status)) {
    return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { certificate: true, license: true, user: true },
  });
  if (!product) return NextResponse.json({ error: 'PRODUCT_NOT_FOUND' }, { status: 404 });

  const startDate = startsAt ? new Date(startsAt) : product.license?.startsAt ?? new Date();
  const expiresDate =
    plan === 'LIFETIME'
      ? null
      : expiresAt
        ? new Date(expiresAt)
        : PLAN_DURATIONS[plan as Plan]
          ? new Date(startDate.getTime() + (PLAN_DURATIONS[plan as Plan]! * 24 * 60 * 60 * 1000))
          : null;

  const code =
    (licenseCode && licenseCode.trim()) ||
    product.license?.licenseCode ||
    product.certificate?.seal_number ||
    product.id;

  const license = await prisma.license.upsert({
    where: { productId },
    update: {
      plan: plan as Plan,
      status: status as LicenseStatus,
      licenseCode: code,
      startsAt: startDate,
      expiresAt: expiresDate,
      certificateId: product.certificate?.id ?? null,
      paidAt: status === 'ACTIVE' ? product.license?.paidAt ?? new Date() : product.license?.paidAt ?? null,
    },
    create: {
      productId,
      plan: plan as Plan,
      status: status as LicenseStatus,
      licenseCode: code,
      startsAt: startDate,
      expiresAt: expiresDate,
      certificateId: product.certificate?.id ?? null,
    },
    include: {
      certificate: true,
    },
  });

  await logAdminAudit({
    adminId: admin.id,
    action: 'LICENSE_UPDATE',
    entityType: 'License',
    entityId: license.id,
    productId: product.id,
    payload: {
      plan,
      status,
      licenseCode: license.licenseCode,
      startsAt: startDate.toISOString(),
      expiresAt: expiresDate ? expiresDate.toISOString() : null,
    },
  });

  return NextResponse.json({ ok: true, license });
}
