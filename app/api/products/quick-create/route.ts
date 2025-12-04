import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { sendPrecheckConfirmation } from '@/lib/email';

export const runtime = 'nodejs';

const Schema = z.object({
  productName: z.string().min(2),
  brand: z.string().min(1),
  category: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  specs: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  madeIn: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
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
        category: data.category || undefined,
        code: data.code || undefined,
        specs: data.specs || undefined,
        size: data.size || undefined,
        madeIn: data.madeIn || undefined,
        material: data.material || undefined,
        status: 'PRECHECK',
        adminProgress: 'PRECHECK',
        paymentStatus: 'UNPAID',
      },
      select: { id: true, name: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true },
    });
    if (user?.email && user?.name) {
      sendPrecheckConfirmation({
        to: user.email,
        name: user.name,
        productName: product.name,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, product });
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ ok: false, errors: err.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: 'PRODUCT_CREATE_FAILED' }, { status: 500 });
  }
}
