import { NextResponse } from 'next/server';
import { ProductStatus } from '@prisma/client';
import { isAdminAuthed } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { sendFailureNotification } from '@/lib/email';

export const runtime = 'nodejs';

const VALID_STATUSES = ['RECEIVED', 'ANALYSIS', 'COMPLETION', 'PASS', 'FAIL'] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

export async function POST(req: Request) {
  const authed = await isAdminAuthed();
  if (!authed) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { productId, status, note } = await req.json();
  if (!productId || !status) return NextResponse.json({ error: 'MISSING_PARAMS' }, { status: 400 });
  if (!VALID_STATUSES.includes(status as ValidStatus)) {
    return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { user: true },
  });
  if (!product) return NextResponse.json({ error: 'PRODUCT_NOT_FOUND' }, { status: 404 });

  const productUpdate: { adminProgress: ValidStatus; status?: ProductStatus } = {
    adminProgress: status as ValidStatus,
  };
  if (['RECEIVED', 'ANALYSIS', 'COMPLETION', 'PASS'].includes(status) && product.status === 'PRECHECK') {
    productUpdate.status = 'IN_REVIEW';
  }
  await prisma.product.update({
    where: { id: product.id },
    data: productUpdate,
  });

  if (status === 'FAIL') {
    await sendFailureNotification({
      to: product.user.email,
      name: product.user.name,
      productName: product.name,
      reason: note?.trim() || 'Bitte reichen Sie fehlende Informationen nach, damit wir die Prüfung fortsetzen können.',
    }).catch((err) => {
      console.error('FAILURE_EMAIL_ERROR', err);
    });
  }

  return NextResponse.json({ ok: true, status });
}
