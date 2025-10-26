import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { password } = await req.json();
  if (!password) return NextResponse.json({ error: "Missing password" }, { status: 400 });
  if (password !== process.env.ADMIN_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  (await cookies()).set("admin_auth", process.env.ADMIN_SECRET!, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 4 // 4 hours
  });

  return NextResponse.json({ ok: true });
}
