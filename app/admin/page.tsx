import { getAdminContext } from '@/lib/admin';
import AdminPageClient from './AdminPageClient';
import type { AdminAuthInfo } from './types';

export default async function AdminPage() {
  const admin = await getAdminContext();
  const initialAdmin: AdminAuthInfo | null = admin
    ? { id: admin.id, email: admin.email, name: admin.name, role: admin.role }
    : null;

  return <AdminPageClient initialAdmin={initialAdmin} />;
}
