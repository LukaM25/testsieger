import { NextResponse } from "next/server";
import QRCode from "qrcode";

import { AdminRole, AssetType } from "@prisma/client";
import { logAdminAudit, requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { generateCertificatePdf } from "@/pdfGenerator";
import { generateSealForS3 } from "@/lib/seal";
import { storeCertificateAssets } from "@/lib/certificateAssets";
import { saveBufferToS3, signedUrlForKey } from "@/lib/storage";

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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireAdmin(AdminRole.SUPERADMIN);
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id: productId } = await params;
  if (!productId) {
    return NextResponse.json({ error: "MISSING_PRODUCT_ID" }, { status: 400 });
  }
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const message = typeof body.message === "string" ? body.message.slice(0, 1000) : undefined;

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { user: true, certificate: true, license: true },
    });
    if (!product) return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 });

    const isPrecheckPaid = product.paymentStatus === "PAID" || product.paymentStatus === "MANUAL";
    if (!isPrecheckPaid) {
      return NextResponse.json({ error: "PRECHECK_NOT_PAID" }, { status: 400 });
    }

    const ratingScore = product.certificate?.ratingScore || "";
    const ratingLabel = product.certificate?.ratingLabel || "";
    if (!ratingScore || !ratingLabel) {
      return NextResponse.json({ error: "RATING_MISSING" }, { status: 400 });
    }

    const seal = product.certificate?.seal_number ?? (await generateSealNumber());
    const certificateRecord =
      product.certificate ??
      (await prisma.certificate.create({
        data: { productId: product.id, pdfUrl: "", qrUrl: "", seal_number: seal },
      }));
    const certificateId = certificateRecord.id;

    const verifyUrl = `${APP_URL.replace(/\/$/, "")}/lizenzen?q=${encodeURIComponent(certificateId)}`;
    const qrBuffer = await QRCode.toBuffer(verifyUrl, { margin: 1, width: 512 });
    const qrDataUrl = `data:image/png;base64,${qrBuffer.toString("base64")}`;
    const existingPdfUrl = certificateRecord.pdfUrl ?? undefined;
    const existingQrUrl = certificateRecord.qrUrl ?? undefined;

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
      status: product.status ?? product.adminProgress ?? 'PENDING',
      seal_number: seal,
      certificateId,
      verify_url: verifyUrl,
      qrUrl: qrDataUrl,
      certificate: {
        seal_number: seal,
        pdfUrl: existingPdfUrl,
        qrUrl: existingQrUrl, // stored location
        externalReferenceId: certificateRecord.externalReferenceId ?? undefined,
      },
      user: {
        name: product.user.name,
        email: product.user.email,
        address: product.user.address ?? null,
        company: product.user.company ?? null,
      },
    };

    const pdfBuffer = await generateCertificatePdf(pdfData);

    const { pdfSigned, qrSigned } = await storeCertificateAssets({
      certificateId,
      productId: product.id,
      userId: product.userId,
      sealNumber: seal,
      pdfBuffer,
      qrBuffer,
    });

    const generatedSeal = await generateSealForS3({
      product: { id: product.id, name: product.name, brand: product.brand, createdAt: product.createdAt },
      certificateId,
      ratingScore,
      ratingLabel,
      appUrl: APP_URL,
      licenseDate: product.license?.startsAt ?? product.license?.paidAt ?? product.license?.createdAt ?? null,
    });
    await saveBufferToS3({ key: generatedSeal.key, body: generatedSeal.buffer, contentType: "image/png" });
    await prisma.asset.upsert({
      where: { key: generatedSeal.key },
      update: {
        type: AssetType.SEAL_IMAGE,
        contentType: "image/png",
        sizeBytes: generatedSeal.buffer.length,
        certificateId,
        productId: product.id,
        userId: product.userId,
      },
      create: {
        key: generatedSeal.key,
        type: AssetType.SEAL_IMAGE,
        contentType: "image/png",
        sizeBytes: generatedSeal.buffer.length,
        certificateId,
        productId: product.id,
        userId: product.userId,
      },
    });
    const sealSigned = await signedUrlForKey(generatedSeal.key).catch(() => null);

    const cert = await prisma.certificate.upsert({
      where: { productId: product.id },
      update: {
        pdfUrl: pdfSigned,
        qrUrl: qrSigned,
        seal_number: seal,
        externalReferenceId: null,
        ratingScore,
        ratingLabel,
        sealUrl: generatedSeal.key,
      },
      create: {
        productId: product.id,
        pdfUrl: pdfSigned,
        qrUrl: qrSigned,
        seal_number: seal,
        externalReferenceId: null,
        ratingScore,
        ratingLabel,
        sealUrl: generatedSeal.key,
      },
    });

    await logAdminAudit({
      adminId: admin.id,
      action: "GENERATE_CERT_WITH_RATING",
      entityType: "Product",
      entityId: product.id,
      productId: product.id,
      payload: { certificateId, ratingScore, ratingLabel, message: message ? true : false },
    });

    return NextResponse.json({
      ok: true,
      certificateId: cert.id,
      pdfUrl: pdfSigned,
      sealUrl: sealSigned ?? generatedSeal.key,
      ratingScore,
      ratingLabel,
    });
  } catch (err: any) {
    console.error("ADMIN_GENERATE_CERT_ERROR", err);
    return NextResponse.json({ error: err?.message || "INTERNAL_ERROR" }, { status: 500 });
  }
}
