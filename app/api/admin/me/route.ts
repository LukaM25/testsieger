import { NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/admin';

export async function GET() {
  const admin = await isAdminAuthed();
  return NextResponse.json({ admin });
}
