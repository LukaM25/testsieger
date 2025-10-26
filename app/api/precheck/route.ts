
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
  const company = String(form.get('company') || '');

  const productName = String(form.get('productName'));
  const brand = String(form.get('brand'));
  const code = String(form.get('code') || '');
  const specs = String(form.get('specs') || '');
  const size = String(form.get('size') || '');
  const madeIn = String(form.get('madeIn') || '');
  const material = String(form.get('material') || '');

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const passwordHash = await bcrypt.hash(password, 10);
    user = await prisma.user.create({ data: { name, email, passwordHash, address } });
    await setSession({ userId: user.id, email: user.email, name: user.name });
  }

  await prisma.product.create({
    data: {
      userId: user!.id,
      name: productName,
      brand,
      code, specs, size, madeIn, material
    }
  });

  return NextResponse.json({ ok: true });
}
