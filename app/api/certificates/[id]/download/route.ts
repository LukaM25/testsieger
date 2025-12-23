import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { ensureSignedS3Url } from "@/lib/s3";
import { getCertificateAssetLinks } from "@/lib/certificateAssets";

export const runtime = "nodejs";

async function getExistingPdfForProduct(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { certificate: true },
  });
  if (!product) throw new Error("NOT_FOUND");

  if (!product.certificate?.id) return null;

  const assets = await getCertificateAssetLinks(product.certificate.id);
  if (assets.OFFICIAL_PDF) return assets.OFFICIAL_PDF;
  if (product.certificate.pdfUrl) {
    return await ensureSignedS3Url(product.certificate.pdfUrl);
  }

  return null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const signedUrl = await getExistingPdfForProduct(id);
    if (!signedUrl || signedUrl === 'SIGNED_URL_UNAVAILABLE') {
      return NextResponse.json({ error: "Missing certificate PDF" }, { status: 404 });
    }
    return NextResponse.redirect(signedUrl);
  } catch (err: any) {
    if (err?.message === "NOT_FOUND") return NextResponse.json({ error: "Product not found" }, { status: 404 });
    console.error("CERT_DOWNLOAD_ERROR", err);
    return NextResponse.json({ error: "Failed to prepare certificate" }, { status: 500 });
  }
}
