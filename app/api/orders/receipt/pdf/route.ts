import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateInvoicePdf } from '@/lib/invoiceBuilder';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function planLabel(plan: string) {
  if (plan === 'PRECHECK_PRIORITY') return 'Grundgebühr (Priority)';
  if (plan === 'PRECHECK_FEE') return 'Grundgebühr';
  if (plan === 'BASIC') return 'Lizenz Basic';
  if (plan === 'PREMIUM') return 'Lizenz Premium';
  if (plan === 'LIFETIME') return 'Lizenz Lifetime';
  return 'Leistung';
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const orderId = (searchParams.get('orderId') || '').trim();
  if (!orderId) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.userId },
    select: {
      id: true,
      plan: true,
      priceCents: true,
      paidAt: true,
      user: { select: { name: true, email: true, address: true } },
      product: { select: { name: true } },
    },
  });

  if (!order) return NextResponse.json({ error: 'ORDER_NOT_FOUND' }, { status: 404 });
  if (!order.paidAt) return NextResponse.json({ error: 'ORDER_NOT_PAID' }, { status: 400 });

  const invoiceBuffer = await generateInvoicePdf({
    invoiceNumber: `REC-${order.id.slice(0, 8).toUpperCase()}`,
    customerName: order.user.name || 'Kunde',
    customerEmail: order.user.email || undefined,
    customerAddress: order.user.address || undefined,
    productName: order.product.name || 'Produkt',
    lines: [{ label: planLabel(order.plan), amountCents: order.priceCents }],
  });

  return new NextResponse(new Uint8Array(invoiceBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="receipt-${order.id.slice(0, 8)}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
