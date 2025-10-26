
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { setSession } from "@/lib/auth";

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get('email'));
  const password = String(form.get('password'));
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: 'Ungültig' }, { status: 401 });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Ungültig' }, { status: 401 });
  await setSession({ userId: user.id, email: user.email, name: user.name });
  return NextResponse.json({ ok: true });
}
