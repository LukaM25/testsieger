import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import Papa from "papaparse";
import QRCode from "qrcode";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { generateCertificatePdf } from "@/pdfGenerator";
import { generateSeal } from "@/lib/seal";
import { sendCertificateAndSealEmail } from "@/lib/email";

const SHEET_LINK = "https://docs.google.com/spreadsheets/d/1uwauj30aZ4KpwSHBL3Yi6yB85H_OQypI5ogKuR82KFk/edit?usp=sharing";
const APP_URL = process.env.APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export const runtime = "nodejs";

function toCsvLink(link: string) {
  if (link.includes("/export?format=csv")) return link;
  const base = link.split("/edit", 1)[0];
  return `${base}/export?format=csv`;
}

type Matrix = string[][];

function getCell(rows: Matrix, row: number, col: number) {
  return (rows[row]?.[col] ?? "").toString().trim();
}

async function fetchSheet() {
  const res = await fetch(toCsvLink(SHEET_LINK));
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
  const csv = await res.text();
  const parsed = Papa.parse<string[]>(csv, { skipEmptyLines: false });
  if (parsed.errors?.length) throw new Error(parsed.errors.map((e) => e.message).join("; "));
  return parsed.data as Matrix;
}

async function generateSealNumber() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const part = Math.random().toString(36).slice(2, 8).toUpperCase();
    const seal = `PS-${new Date().getFullYear()}-${part}`;
    const exists = await prisma.certificate.findUnique({ where: { seal_number: seal } }).catch(() => null);
    if (!exists) return seal;
  }
  throw new Error("SEAL_GENERATION_FAILED");
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id: productId } = params;
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const message = typeof body.message === "string" ? body.message.slice(0, 1000) : undefined;

  try {
    const rows = await fetchSheet();
    const sheetProductId = getCell(rows, 1, 3); // D2
    const ratingScore = getCell(rows, 72, 3); // D73
    const ratingLabel = getCell(rows, 72, 4); // E73

    if (!ratingScore || !ratingLabel) {
      return NextResponse.json({ error: "Rating cells D73/E73 are empty." }, { status: 400 });
    }

    if (sheetProductId && sheetProductId !== productId) {
      return NextResponse.json({ error: `Sheet productId (${sheetProductId}) does not match requested product (${productId}).` }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { user: true, certificate: true },
    });
    if (!product) return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 });

    const seal = product.certificate?.seal_number ?? (await generateSealNumber());
    const certificateRecord =
      product.certificate ??
      (await prisma.certificate.create({
        data: { productId: product.id, pdfUrl: "", qrUrl: "", seal_number: seal },
      }));
    const certificateId = certificateRecord.id;

    const verifyUrl = `${APP_URL.replace(/\/$/, "")}/lizenzen?q=${encodeURIComponent(certificateId)}`;
    const qrBuffer = await QRCode.toBuffer(verifyUrl, { margin: 1, width: 512 });

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
        email: product.user.email,
        address: product.user.address ?? null,
        company: product.user.company ?? null,
      },
      certificate: {
        seal_number: seal,
        pdfUrl: certificateRecord.pdfUrl ?? undefined,
        qrUrl: certificateRecord.qrUrl ?? undefined,
        externalReferenceId: certificateRecord.externalReferenceId ?? undefined,
      },
      certificateId,
      domain: APP_URL,
    });

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const qrDir = path.join(process.cwd(), "public", "qr");
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(qrDir, { recursive: true });

    const pdfRel = `/uploads/REPORT_${seal}.pdf`;
    const pdfAbs = path.join(uploadsDir, `REPORT_${seal}.pdf`);
    await fs.writeFile(pdfAbs, pdfBuffer);

    const qrRel = `/qr/${seal}.png`;
    const qrAbs = path.join(qrDir, `${seal}.png`);
    await fs.writeFile(qrAbs, qrBuffer);

    const sealPath = await generateSeal({
      product: { id: product.id, name: product.name, brand: product.brand, createdAt: product.createdAt },
      certificateId,
      ratingScore,
      ratingLabel,
      appUrl: APP_URL,
    });

    const cert = await prisma.certificate.upsert({
      where: { productId: product.id },
      update: {
        pdfUrl: pdfRel,
        qrUrl: qrRel,
        seal_number: seal,
        externalReferenceId: null,
        ratingScore,
        ratingLabel,
        sealUrl: sealPath,
      },
      create: {
        productId: product.id,
        pdfUrl: pdfRel,
        qrUrl: qrRel,
        seal_number: seal,
        externalReferenceId: null,
        ratingScore,
        ratingLabel,
        sealUrl: sealPath,
      },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: { status: "COMPLETED", adminProgress: "PASS" },
    });

    // Email customer with PDF + seal attachments
    try {
      const sealAbs = path.join(process.cwd(), "public", sealPath.replace(/^\//, ""));
      const sealBuffer = await fs.readFile(sealAbs);
      await sendCertificateAndSealEmail({
        to: product.user.email,
        name: product.user.name,
        productName: product.name,
        verifyUrl,
        pdfBuffer,
        sealBuffer,
        message,
      });
    } catch (err) {
      console.error("CERT_SEAL_EMAIL_ERROR", err);
    }

    return NextResponse.json({
      ok: true,
      certificateId: cert.id,
      pdfUrl: pdfRel,
      sealUrl: sealPath,
      ratingScore,
      ratingLabel,
    });
  } catch (err: any) {
    console.error("ADMIN_GENERATE_CERT_ERROR", err);
    return NextResponse.json({ error: err?.message || "INTERNAL_ERROR" }, { status: 500 });
  }
}
