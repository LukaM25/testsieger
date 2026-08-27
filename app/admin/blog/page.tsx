import { AdminRole } from '@prisma/client';
import { redirect } from 'next/navigation';

import { getAdminContext, hasRequiredRole } from '@/lib/admin';
import BlogAdminClient from './BlogAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  const admin = await getAdminContext();
  if (!admin) redirect('/admin');
  if (!hasRequiredRole(admin.role, AdminRole.SUPERADMIN)) redirect('/admin');

  return <BlogAdminClient />;
}
