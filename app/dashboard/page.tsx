import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient'; 

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      products: {
        include: { certificate: true },
        orderBy: { createdAt: 'desc' },
      },
      orders: { include: { product: true }, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!user) redirect('/login');

  return <DashboardClient user={user} />;
}
