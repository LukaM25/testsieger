import { redirect } from 'next/navigation';
import { getAdminContext } from '@/lib/admin';
import ASAdminList from './ASAdminList';

export const dynamic = 'force-dynamic';

export default async function ASAdminPage() {
  const admin = await getAdminContext();
  if (!admin) redirect('/admin');
  return <ASAdminList isSuperAdmin={admin.role === 'SUPERADMIN'} />;
}
