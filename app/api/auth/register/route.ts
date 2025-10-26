
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { setSession } from "@/lib/auth";

export async function POST(req: Request) {
  const form = await req.formData();
  const name = String(form.get('name'));
  const email = String(form.get('email'));
  const password = String(form.get('password'));
  const address = String(form.get('address') || '');
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: 'E‑Mail bereits registriert' }, { status: 400 });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, passwordHash, address } });
  await setSession({ userId: user.id, email: user.email, name: user.name });
  return NextResponse.json({ ok: true });
}
