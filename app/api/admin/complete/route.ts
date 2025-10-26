import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPdfDocument, getDocumentCard } from "@/lib/pdfmonkey";
import QRCode from "qrcode";
import { cookies } from "next/headers";

async function isAdmin(req: Request): Promise<boolean> {
  const header = req.headers.get("x-admin-secret");
  const cookieStore = await cookies();
  const cookie = cookieStore.get("admin_auth")?.value;
  const secret = process.env.ADMIN_SECRET;
  return (!!header && header === secret) || (!!cookie && cookie === secret);
}

export async function POST(req: Request) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // ...rest of your logic unchanged...
}
