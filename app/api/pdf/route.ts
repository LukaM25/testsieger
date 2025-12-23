import { NextResponse } from "next/server";
import { AdminRole } from "@prisma/client";

import { generateCertificatePdf } from "@/pdfGenerator";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = await requireAdmin(AdminRole.SUPERADMIN).catch(() => null);
  if (!admin) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { product = {}, user = {}, certificate = {}, certificateId, domain } = await req.json();
  if (!certificateId) {
    return NextResponse.json({ error: "MISSING_CERTIFICATE_ID" }, { status: 400 });
  }

  const pdfBuffer = await generateCertificatePdf({
    product,
    user,
    certificate,
    certificateId,
    domain,
  });

 return new NextResponse(pdfBuffer as unknown as BodyInit, {
  status: 200,
  headers: {
    "Content-Type": "application/pdf",
  },
});
}
