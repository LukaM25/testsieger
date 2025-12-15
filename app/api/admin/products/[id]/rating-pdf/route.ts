import { NextResponse } from "next/server";
import { AdminRole } from "@prisma/client";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { fetchStoredRatingPdfAttachment } from "@/lib/ratingSheet";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(AdminRole.EXAMINER);
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id: productId } = await params;
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true } });
  if (!product) return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 });

  const sluggedName = product.name
    ? product.name
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/(^-+|-+$)/g, "")
        .toLowerCase()
    : "unbenannt";

  try {
    const rating = await fetchStoredRatingPdfAttachment(productId);
    if (!rating) return NextResponse.json({ error: "RATING_PDF_MISSING" }, { status: 404 });
    return new NextResponse(new Uint8Array(rating.buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="pruefergebnis-${productId}-${sluggedName}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("RATING_PDF_DOWNLOAD_ERROR", err);
    return NextResponse.json({ error: "FAILED_TO_DOWNLOAD_PDF" }, { status: 500 });
  }
}

