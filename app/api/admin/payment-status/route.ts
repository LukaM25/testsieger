import { NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { sendPrecheckPaymentSuccess } from '@/lib/email';

export const runtime = 'nodejs';

const VALID_STATUSES = ['UNPAID', 'PAID', 'MANUAL'] as const;
type ValidPaymentStatus = (typeof VALID_STATUSES)[number];

export async function POST(req: Request) {
  const authed = await isAdminAuthed();
  if (!authed) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { productId, status } = await req.json();
  if (!productId || !status) return NextResponse.json({ error: 'MISSING_PARAMS' }, { status: 400 });
  if (!VALID_STATUSES.includes(status as ValidPaymentStatus)) {
    return NextResponse.json({ error: 'INVALID_PAYMENT_STATUS' }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId }, include: { user: true } });
  if (!product) return NextResponse.json({ error: 'PRODUCT_NOT_FOUND' }, { status: 404 });
  if (product.paymentStatus === status) {
    return NextResponse.json({ ok: true, paymentStatus: status });
  }

  await prisma.product.update({
    where: { id: product.id },
    data: { paymentStatus: status as ValidPaymentStatus },
  });

  if (['PAID', 'MANUAL'].includes(status as ValidPaymentStatus) && product.user) {
    try {
      await sendPrecheckPaymentSuccess({
        to: product.user.email,
        name: product.user.name,
        productName: product.name,
        processNumber: product.id,
        receiptPdf: undefined,
      });
    } catch (err) {
      console.error('ADMIN_PAYMENT_STATUS_EMAIL_ERROR', err);
    }
  }

  return NextResponse.json({ ok: true, paymentStatus: status });
}
