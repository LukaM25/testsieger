import { NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/admin';

export async function GET() {
  const admin = await getAdminContext();
  return NextResponse.json({
    admin: admin
      ? { id: admin.id, email: admin.email, name: admin.name, role: admin.role }
      : null,
  });
}
