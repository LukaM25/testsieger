import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

type Props = {
  searchParams?: Promise<{ preview?: string }> | { preview?: string };
};

export default async function DashboardPage({ searchParams }: Props) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const preview =
    process.env.NODE_ENV !== 'production' && resolvedSearchParams?.preview === '1';
  if (preview) {
    const now = Date.now();
    const mockUser = {
      id: 'preview-user',
      name: 'Max Mustermann',
      email: 'max@example.com',
      address: 'Musterstraße 5, 12345 Berlin',
      products: [
        {
          id: 'prod-1',
          name: 'Kaffeemaschine Pro',
          brand: 'AromaTech',
          status: 'PAID',
          adminProgress: 'PASS',
          paymentStatus: 'PAID',
          createdAt: new Date(now - 1000 * 60 * 60 * 24 * 120).toISOString(),
          certificate: { id: 'cert-1', pdfUrl: null },
          license: { status: 'ACTIVE', plan: 'BASIC' },
        },
        {
          id: 'prod-2',
          name: 'Smart Lampe',
          brand: 'LumenCo',
          status: 'PAID',
          adminProgress: 'PASS',
          paymentStatus: 'PAID',
          createdAt: new Date(now - 1000 * 60 * 60 * 24 * 80).toISOString(),
          certificate: { id: 'cert-2', pdfUrl: null },
          license: { status: 'EXPIRED', plan: 'PREMIUM' },
        },
        {
          id: 'prod-3',
          name: 'Buerostuhl Ergo',
          brand: 'ErgoWorks',
          status: 'PRECHECK',
          adminProgress: 'PRECHECK',
          paymentStatus: 'UNPAID',
          createdAt: new Date(now - 1000 * 60 * 60 * 24 * 20).toISOString(),
          certificate: null,
          license: null,
        },
      ],
      orders: [
        {
          id: 'order-1',
          productId: 'prod-1',
          plan: 'PRECHECK_FEE',
          priceCents: 22900,
          createdAt: new Date(now - 1000 * 60 * 60 * 24 * 115).toISOString(),
          paidAt: new Date(now - 1000 * 60 * 60 * 24 * 114).toISOString(),
          product: { id: 'prod-1', name: 'Kaffeemaschine Pro' },
        },
        {
          id: 'order-2',
          productId: 'prod-2',
          plan: 'PREMIUM',
          priceCents: 0,
          createdAt: new Date(now - 1000 * 60 * 60 * 24 * 70).toISOString(),
          paidAt: new Date(now - 1000 * 60 * 60 * 24 * 69).toISOString(),
          product: { id: 'prod-2', name: 'Smart Lampe' },
        },
      ],
    };

    return <DashboardClient user={mockUser} />;
  }

  const session = await getSession();
  if (!session) redirect('/login');

  const user = await prisma.user.findFirst({
    where: { id: session.userId, active: true, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      address: true,
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
        address: user.address ?? null,
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
