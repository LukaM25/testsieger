import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/cookies';

export async function POST() {
  await clearSession();
  return NextResponse.redirect('/login');
}
