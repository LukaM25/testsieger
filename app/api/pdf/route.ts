import { NextResponse } from "next/server";
import { generateCertificatePdf } from "@/pdfGenerator";

export const runtime = "nodejs";

export async function POST(req: Request) {
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
