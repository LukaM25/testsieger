import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCertificatePdf } from "@/pdfGenerator";
import QRCode from "qrcode";
import { generateSeal as generateSealImage } from "@/lib/seal";
import { storeCertificateAssets } from "@/lib/certificateAssets";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { productId } = await req.json();

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { user: true, certificate: true },
    });

    if (!product) return NextResponse.json({ error: "Produkt nicht gefunden" }, { status: 404 });

    const existingCert = product.certificate;
    const seal_number = existingCert?.seal_number ?? generateSeal();
    const baseDomain =
      process.env.NEXT_PUBLIC_BASE_URL || process.env.APP_URL || "http://localhost:3000";

    // Ensure a certificate row exists so we can use its id in the QR/verify URL.
    const cert =
      existingCert ??
      (await prisma.certificate.create({
        data: {
          productId: product.id,
          pdfUrl: "",
          qrUrl: "",
          seal_number,
        },
      }));

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
        status: product.status,
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

function generateSeal() {
  return `ABC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}
