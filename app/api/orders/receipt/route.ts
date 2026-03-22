import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Schema = z.object({
  orderId: z.string().min(1),
});

function getFallbackReceiptUrl(orderId: string) {
  return `/api/orders/receipt/pdf?orderId=${encodeURIComponent(orderId)}`;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  let input: z.infer<typeof Schema>;
  try {
    input = Schema.parse(await req.json());
  } catch (err: any) {
    if (err?.issues) return NextResponse.json({ error: 'INVALID_INPUT', issues: err.issues }, { status: 400 });
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: input.orderId, userId: session.userId },
    select: { id: true, paidAt: true },
  });
  if (!order) return NextResponse.json({ error: 'ORDER_NOT_FOUND' }, { status: 404 });
  if (!order.paidAt) return NextResponse.json({ error: 'ORDER_NOT_PAID' }, { status: 400 });

  return NextResponse.json(
    { ok: true, receiptUrl: getFallbackReceiptUrl(order.id) },
    { status: 200 }
  );
}
