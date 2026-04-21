import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendPrecheckConfirmation } from '@/lib/email';
import { notifySuperadminsOfPrecheckRegistration } from '@/lib/precheckNotifications';

export const runtime = 'nodejs';

const Schema = z.object({
  productName: z.string().trim().min(2),
  brand: z.string().trim().min(1),
  category: z.string().trim().min(1),
  code: z.string().trim().min(2),
  specs: z.string().trim().min(5),
  size: z.string().trim().min(2),
  madeIn: z.string().trim().min(2),
  material: z.string().trim().min(2),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    const json = await req.json();
    const data = Schema.parse(json);

    const product = await prisma.product.create({
      data: {
        userId: session.userId,
        name: data.productName,
        brand: data.brand,
        category: data.category,
        code: data.code,
        specs: data.specs,
        size: data.size,
        madeIn: data.madeIn,
        material: data.material,
        status: 'PRECHECK',
        adminProgress: 'PRECHECK',
        paymentStatus: 'UNPAID',
      },
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
        adminProgress: true,
        paymentStatus: true,
        createdAt: true,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true, gender: true, company: true },
    });
    if (user?.email && user?.name) {
      void sendPrecheckConfirmation({
        to: user.email,
        name: user.name,
        gender: user.gender ?? undefined,
        productName: product.name,
      }).catch((error) => {
        console.error('PRECHECK_CONFIRMATION_EMAIL_FAILED', { productId: product.id, error });
      });

      void notifySuperadminsOfPrecheckRegistration({
        productId: product.id,
        productName: product.name,
        brand: product.brand,
        category: product.category,
        code: product.code,
        customerName: user.name,
        customerEmail: user.email,
        customerCompany: user.company ?? null,
        sourceLabel: 'Dashboard-Produktanlage',
      }).catch((error) => {
        console.error('PRECHECK_SUPERADMIN_NOTIFICATION_ERROR', { productId: product.id, error });
      });
    }

    return NextResponse.json({
      ok: true,
      product: {
        ...product,
        createdAt: product.createdAt.toISOString(),
      },
    });
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ ok: false, errors: err.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: 'PRODUCT_CREATE_FAILED' }, { status: 500 });
  }
}
