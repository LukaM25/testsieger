import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPdfDocument, getDocumentCard } from "@/lib/pdfmonkey";
import { sendPrecheckConfirmation } from "@/lib/email";
import QRCode from "qrcode";

export async function POST(req: Request) {
  try {
    const { productId } = await req.json();

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { user: true },
    });

    if (!product) return NextResponse.json({ error: "Produkt nicht gefunden" }, { status: 404 });

    const seal_number = `ABC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const qr_target = `${process.env.NEXT_PUBLIC_BASE_URL}/reports/${product.id}`;
    const qr_url = await QRCode.toDataURL(qr_target);

    const valid_to = new Date();
    valid_to.setFullYear(valid_to.getFullYear() + 3);

    const pdf = await createPdfDocument({
      product_name: product.name,
      brand_name: product.brand,
      sku: product.code || "-",
      seal_number,
      valid_to: valid_to.toISOString().split("T")[0],
      report_url: qr_target,
      qr_url,
    });
    if (!pdf.id) {
      throw new Error("PDFMonkey did not return an id");
    }

    const card = await waitForDocumentSuccess(pdf.id);

    await prisma.certificate.create({
      data: {
        productId: product.id,
        seal_number,
        pdfUrl: card.downloadUrl ?? "",
        qrUrl: qr_target,
        pdfmonkeyDocumentId: pdf.id,
      },
    });

    await sendPrecheckConfirmation({
      to: product.user.email,
      name: product.user.name,
      productName: product.name,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Error generating certificate:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function waitForDocumentSuccess(id: string, timeoutMs = 20000, intervalMs = 1500) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const card = await getDocumentCard(id);
    if (card.status === "success" && card.downloadUrl) {
      return card;
    }
    if (card.status === "failure") {
      throw new Error("PDF generation failed");
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error("PDF generation timed out");
}
