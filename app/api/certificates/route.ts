import { NextResponse } from "next/server";
import QRCode from "qrcode";
import crypto from "crypto";
import { AdminRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { generateCertificatePdf } from "@/pdfGenerator";
import { generateSeal as generateSealImage } from "@/lib/seal";
import { storeCertificateAssets } from "@/lib/certificateAssets";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(AdminRole.SUPERADMIN).catch(() => null);
    if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const { productId } = await req.json();

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { user: true, certificate: true },
    });

    if (!product) return NextResponse.json({ error: "Produkt nicht gefunden" }, { status: 404 });

    const isPrecheckPaid = product.paymentStatus === "PAID" || product.paymentStatus === "MANUAL";
    if (!isPrecheckPaid) {
      return NextResponse.json({ error: "PRECHECK_NOT_PAID" }, { status: 400 });
    }

    const existingCert = product.certificate;
    const baseDomain =
      process.env.NEXT_PUBLIC_BASE_URL || process.env.APP_URL || "http://localhost:3000";

    let cert = existingCert;
    let seal_number = existingCert?.seal_number ?? '';
    if (!cert) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateSealNumber();
        try {
          cert = await prisma.certificate.create({
            data: {
              productId: product.id,
              pdfUrl: "",
              qrUrl: "",
              seal_number: candidate,
            },
          });
          seal_number = candidate;
          break;
        } catch (err: any) {
          if (err?.code === 'P2002') {
            continue; // retry on unique constraint
          }
          throw err;
        }
      }
      if (!cert || !seal_number) {
        throw new Error('SEAL_ALLOCATION_FAILED');
      }
    } else {
      seal_number = cert.seal_number;
    }

    const verifyUrl = `${baseDomain.replace(/\/$/, "")}/lizenzen?q=${encodeURIComponent(cert.id)}`;
    const qrBuffer = await QRCode.toBuffer(verifyUrl, { margin: 1, width: 512 });
    const qrDataUrl = `data:image/png;base64,${qrBuffer.toString("base64")}`;

    const pdfBuffer = await generateCertificatePdf({
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category ?? null,
        code: product.code ?? null,
        specs: product.specs ?? null,
        size: product.size ?? null,
        madeIn: product.madeIn ?? null,
        material: product.material ?? null,
        status: 'PASS',
        statusCheck: true,
        adminProgress: product.adminProgress,
        paymentStatus: product.paymentStatus,
        createdAt: product.createdAt.toISOString(),
      },
      user: {
        name: product.user.name,
        company: product.user.company ?? null,
        email: product.user.email,
        address: product.user.address ?? null,
      },
      certificate: {
        seal_number,
        pdfUrl: existingCert?.pdfUrl ?? undefined,
        qrUrl: existingCert?.qrUrl ?? undefined,
        externalReferenceId: existingCert?.externalReferenceId ?? undefined,
      },
      certificateId: cert.id,
      domain: baseDomain,
      qrUrl: qrDataUrl,
    });

    const { pdfSigned, qrSigned } = await storeCertificateAssets({
      certificateId: cert.id,
      productId: product.id,
      userId: product.userId,
      sealNumber: seal_number,
      pdfBuffer,
      qrBuffer,
    });

    let sealUrl = cert.sealUrl || existingCert?.sealUrl || null;
    if (!sealUrl) {
      try {
        sealUrl = await generateSealImage({
          product: { id: product.id, name: product.name, brand: product.brand, createdAt: product.createdAt },
          certificateId: cert.id,
          tcCode: product.processNumber ?? undefined,
          ratingScore: cert.ratingScore ?? 'PASS',
          ratingLabel: cert.ratingLabel ?? 'PASS',
          appUrl: baseDomain,
        });
      } catch (err) {
        console.warn('SEAL_GENERATION_FAILED', err);
      }
    }

    await prisma.certificate.update({
      where: { id: cert.id },
      data: {
        pdfUrl: pdfSigned,
        qrUrl: qrSigned,
        seal_number,
        externalReferenceId: null,
        sealUrl,
        status: 'PASS',
      },
    });

    return NextResponse.json({
      success: true,
      certificateId: cert.id,
      seal: seal_number,
      pdfUrl: pdfSigned,
      qrUrl: qrSigned,
      verifyUrl,
    });
  } catch (e: any) {
    console.error("Error generating certificate:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function generateSealNumber() {
  return `DPI-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}
