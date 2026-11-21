import { redirect } from 'next/navigation';
import { getAdminContext } from '@/lib/admin';
import ASAdminDetail from './ASAdminDetail';

export const dynamic = 'force-dynamic';

export default async function ASAdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminContext();
  if (!admin) redirect('/admin');
  const { id } = await params;
  return <ASAdminDetail id={id} canEdit={admin.role !== 'VIEWER'} />;
}
