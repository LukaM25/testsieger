import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCompletionEmail } from "@/lib/email";
import { generateCertificatePdf } from "@/pdfGenerator";
import QRCode from "qrcode";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { productId, message } = await req.json();

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

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const qrDir = path.join(process.cwd(), "public", "qr");
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(qrDir, { recursive: true });

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
    });

    const pdfRel = `/uploads/REPORT_${seal_number}.pdf`;
    const pdfAbs = path.join(uploadsDir, `REPORT_${seal_number}.pdf`);
    await fs.writeFile(pdfAbs, pdfBuffer);

    const qrRel = `/qr/${seal_number}.png`;
    const qrAbs = path.join(qrDir, `${seal_number}.png`);
    await fs.writeFile(qrAbs, qrBuffer);

    await prisma.certificate.update({
      where: { id: cert.id },
      data: {
        pdfUrl: pdfRel,
        qrUrl: qrRel,
        seal_number,
        externalReferenceId: null,
      },
    });

    await sendCompletionEmail({
      to: product.user.email,
      name: product.user.name,
      productName: product.name,
      verifyUrl,
      pdfUrl: pdfRel,
      qrUrl: qrRel,
      pdfBuffer,
      documentId: undefined,
      message: typeof message === 'string' ? message.slice(0, 1000) : undefined,
    });

    return NextResponse.json({
      success: true,
      certificateId: cert.id,
      seal: seal_number,
      pdfUrl: pdfRel,
      qrUrl: qrRel,
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
