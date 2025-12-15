import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient'; 

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      products: {
        select: {
          id: true,
          name: true,
          brand: true,
          status: true,
          adminProgress: true,
          paymentStatus: true,
          createdAt: true,
          certificate: { select: { id: true, pdfUrl: true } },
          license: { select: { status: true, plan: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      orders: {
        select: {
          id: true,
          productId: true,
          plan: true,
          priceCents: true,
          createdAt: true,
          paidAt: true,
          product: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user) redirect('/login');

  return (
    <DashboardClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        products: (user.products || []).map((p) => ({
          id: p.id,
          name: p.name,
          brand: p.brand ?? null,
          status: p.status,
          adminProgress: p.adminProgress,
          paymentStatus: p.paymentStatus,
          createdAt: p.createdAt.toISOString(),
          certificate: p.certificate ? { id: p.certificate.id, pdfUrl: null } : null,
          license: p.license ? { status: p.license.status, plan: p.license.plan } : null,
        })),
        orders: (user.orders || []).map((o) => ({
          id: o.id,
          productId: o.productId,
          plan: o.plan,
          priceCents: o.priceCents,
          createdAt: o.createdAt.toISOString(),
          paidAt: o.paidAt ? o.paidAt.toISOString() : null,
          product: o.product ? { id: o.product.id, name: o.product.name } : null,
        })),
      }}
    />
  );
}
