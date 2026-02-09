import { NextResponse } from 'next/server';
import { AdminRole } from '@prisma/client';
import { logAdminAudit, requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { sendPrecheckPaymentSuccess } from '@/lib/email';
import { ensureProcessNumber } from '@/lib/processNumber';

export const runtime = 'nodejs';

const VALID_STATUSES = ['UNPAID', 'PAID', 'MANUAL'] as const;
type ValidPaymentStatus = (typeof VALID_STATUSES)[number];

export async function POST(req: Request) {
  const admin = await requireAdmin(AdminRole.SUPERADMIN).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { productId, status } = await req.json();
  if (!productId || !status) return NextResponse.json({ error: 'MISSING_PARAMS' }, { status: 400 });
  if (!VALID_STATUSES.includes(status as ValidPaymentStatus)) {
    return NextResponse.json({ error: 'INVALID_PAYMENT_STATUS' }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId }, include: { user: true } });
  if (!product) return NextResponse.json({ error: 'PRODUCT_NOT_FOUND' }, { status: 404 });
  if (product.paymentStatus === status) {
    return NextResponse.json({ ok: true, paymentStatus: status, productStatus: product.status });
  }

  const wasUnpaid = product.paymentStatus === 'UNPAID';
  const isPayingNow = status === 'PAID' || status === 'MANUAL';

  await prisma.product.update({
    where: { id: product.id },
    data: {
      paymentStatus: status as ValidPaymentStatus,
      status: isPayingNow && product.status === 'PRECHECK' ? 'PAID' : product.status,
    },
  });

  await logAdminAudit({
    adminId: admin.id,
    action: 'PAYMENT_STATUS_UPDATE',
    entityType: 'Product',
    entityId: product.id,
    productId: product.id,
    payload: { from: product.paymentStatus, to: status },
  });

  if (wasUnpaid && isPayingNow && product.user) {
    try {
      const processNumber = await ensureProcessNumber(product.id);
      await sendPrecheckPaymentSuccess({
        to: product.user.email,
        name: product.user.name,
        gender: product.user.gender ?? undefined,
        productNames: [product.name],
        processNumber,
        receiptPdf: undefined,
      });
    } catch (err) {
      console.error('ADMIN_PAYMENT_STATUS_EMAIL_ERROR', err);
    }
  }

  const nextProductStatus = isPayingNow && product.status === 'PRECHECK' ? 'PAID' : product.status;
  return NextResponse.json({ ok: true, paymentStatus: status, productStatus: nextProductStatus });
}
