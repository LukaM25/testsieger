import { NextResponse } from 'next/server';
import { setAdminSession } from '@/lib/admin';

export async function POST(req: Request) {
  const { password } = await req.json();
  if (!password) return NextResponse.json({ ok: false }, { status: 400 });
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  await setAdminSession();
  return NextResponse.json({ ok: true });
}
