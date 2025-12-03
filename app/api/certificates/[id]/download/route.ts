import { NextResponse } from "next/server";
import QRCode from "qrcode";

import { prisma } from "@/lib/prisma";
import { uploadToS3, s3PublicUrl, ensureSignedS3Url } from "@/lib/s3";
import { generateCertificatePdf } from "@/pdfGenerator";

const APP_URL = process.env.APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export const runtime = "nodejs";

async function generateSealNumber() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const part = Math.random().toString(36).slice(2, 8).toUpperCase();
    const seal = `PS-${new Date().getFullYear()}-${part}`;
    const exists = await prisma.certificate.findUnique({ where: { seal_number: seal } }).catch(() => null);
    if (!exists) return seal;
  }
  throw new Error("SEAL_GENERATION_FAILED");
}

async function ensurePdfForProduct(productId: string, forceRegenerate: boolean) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { user: true, certificate: true },
  });
  if (!product) throw new Error("NOT_FOUND");

  const seal = product.certificate?.seal_number ?? (await generateSealNumber());
  const certificateRecord =
    product.certificate ??
    (await prisma.certificate.create({
      data: { productId: product.id, pdfUrl: "", qrUrl: "", seal_number: seal },
    }));
  const certificateId = certificateRecord.id;

  if (certificateRecord.pdfUrl && !forceRegenerate) {
    return await ensureSignedS3Url(certificateRecord.pdfUrl);
  }

  const verifyUrl = `${APP_URL.replace(/\/$/, "")}/lizenzen?q=${encodeURIComponent(certificateId)}`;
  const qrBuffer = await QRCode.toBuffer(verifyUrl, { margin: 1, width: 512 });
  const qrDataUrl = `data:image/png;base64,${qrBuffer.toString("base64")}`;

  const pdfKey = `uploads/REPORT_${seal}.pdf`;
  const qrKey = `qr/${seal}.png`;
  const pdfUrl = s3PublicUrl(pdfKey);
  const qrUrl = s3PublicUrl(qrKey);

  const pdfData = {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category ?? null,
    code: product.code ?? null,
    specs: product.specs ?? null,
    size: product.size ?? null,
    madeIn: product.madeIn ?? null,
    material: product.material ?? null,
    createdAt: product.createdAt.toISOString(),
    status: product.status ?? product.adminProgress ?? "COMPLETED",
    seal_number: seal,
    certificateId,
    verify_url: verifyUrl,
    qrUrl: qrDataUrl,
    certificate: {
      seal_number: seal,
      pdfUrl,
      qrUrl, // stored location
      externalReferenceId: certificateRecord.externalReferenceId ?? undefined,
    },
    user: {
      name: product.user.name,
      company: product.user.company ?? null,
      email: product.user.email,
      address: product.user.address ?? null,
    },
  };

  const pdfBuffer = await generateCertificatePdf(pdfData);

  await uploadToS3({ key: pdfKey, body: pdfBuffer, contentType: "application/pdf" });
  await uploadToS3({ key: qrKey, body: qrBuffer, contentType: "image/png" });

  await prisma.certificate.update({
    where: { id: certificateId },
    data: { pdfUrl, qrUrl, seal_number: seal },
  });

  return await ensureSignedS3Url(pdfUrl);
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const url = new URL(req.url);
  const forceRegenerate = url.searchParams.get("regenerate") === "true";

  try {
    const signedUrl = await ensurePdfForProduct(id, forceRegenerate);
    if (!signedUrl) return NextResponse.json({ error: "Missing certificate PDF" }, { status: 404 });
    return NextResponse.redirect(signedUrl);
  } catch (err: any) {
    if (err?.message === "NOT_FOUND") return NextResponse.json({ error: "Product not found" }, { status: 404 });
    console.error("CERT_DOWNLOAD_ERROR", err);
    return NextResponse.json({ error: "Failed to prepare certificate" }, { status: 500 });
  }
}
