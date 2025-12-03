import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const APP_URL = process.env.APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing certificate id" }, { status: 400 });

  try {
    const cert = await prisma.certificate.findUnique({
      where: { id },
      select: { productId: true },
    });
    if (!cert?.productId) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    // Server-side fetch to the download endpoint so we can stream the PDF back inline
    const downloadUrl = `${APP_URL.replace(/\/$/, "")}/api/certificates/${cert.productId}/download`;
    const res = await fetch(downloadUrl, { redirect: "follow" });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch certificate PDF" }, { status: res.status });
    }
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Certificate_${cert.productId}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("CERT_PREVIEW_ERROR", err);
    return NextResponse.json({ error: "Failed to prepare preview" }, { status: 500 });
  }
}
