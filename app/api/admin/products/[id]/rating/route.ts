import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { AdminRole, AssetType } from '@prisma/client';

import { requireAdmin, logAdminAudit } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { computeRating, buildRatingCsvV1, normalizeNote, normalizeScore, RATING_CRITERIA_V1 } from '@/lib/ratingV1';
import { saveBufferToS3 } from '@/lib/storage';
import { buildRatingPdfHtmlV1 } from '@/lib/ratingPdfV1';
import { renderHtmlToPdfBuffer } from '@/lib/htmlToPdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sha256(input: Buffer) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function getRatingSnapshot(snapshotData: unknown) {
  const snap = (snapshotData || {}) as any;
  const rating = (snap.ratingV1 || {}) as any;
  return {
    raw: rating,
    lockedAt: typeof rating.lockedAt === 'string' ? (rating.lockedAt as string) : null,
    values: (rating.values || {}) as Record<string, { score?: any; note?: any }>,
    csv: rating.csv as any,
    pdf: rating.pdf as any,
  };
}

function toPersistableValues(input: any) {
  const output: Record<string, { score: number | null; note: string | null }> = {};
  const allowedIds = new Set(RATING_CRITERIA_V1.map((c) => c.id));
  const values = (input && typeof input === 'object' ? input : {}) as Record<string, any>;
  for (const [id, value] of Object.entries(values)) {
    if (!allowedIds.has(id)) continue;
    const score = normalizeScore(value?.score);
    const note = normalizeNote(value?.note);
    output[id] = { score, note };
  }
  // Ensure all ids exist in the persisted object (so UI is stable)
  for (const id of allowedIds) {
    if (!output[id]) output[id] = { score: null, note: null };
  }
  return output;
}

async function ensureCertificate(productId: string, userId: string) {
  const existing = await prisma.certificate.findUnique({ where: { productId } });
  if (existing) return existing;
  return prisma.certificate.create({
    data: {
      productId,
      pdfUrl: '',
      qrUrl: '',
      // seal_number default(uuid()) in schema
    },
  });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(AdminRole.EXAMINER).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { id: productId } = await params;
  if (!productId) return NextResponse.json({ error: 'MISSING_PRODUCT_ID' }, { status: 400 });

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      userId: true,
      processNumber: true,
      certificate: { select: { id: true, snapshotData: true } },
    },
  });
  if (!product) return NextResponse.json({ error: 'PRODUCT_NOT_FOUND' }, { status: 404 });

  const rating = getRatingSnapshot(product.certificate?.snapshotData);
  const persistedValues = toPersistableValues(rating.values);
  const computed = computeRating(persistedValues);

  return NextResponse.json({
    ok: true,
    product: { id: product.id, name: product.name },
    lockedAt: rating.lockedAt,
    values: persistedValues,
    computed,
    csv: rating.csv ?? null,
    pdf: rating.pdf ?? null,
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(AdminRole.EXAMINER).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { id: productId } = await params;
  if (!productId) return NextResponse.json({ error: 'MISSING_PRODUCT_ID' }, { status: 400 });

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      userId: true,
      processNumber: true,
      certificate: { select: { id: true, snapshotData: true } },
    },
  });
  if (!product) return NextResponse.json({ error: 'PRODUCT_NOT_FOUND' }, { status: 404 });

  const current = getRatingSnapshot(product.certificate?.snapshotData);
  if (current.lockedAt) return NextResponse.json({ error: 'LOCKED' }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  const values = toPersistableValues(body?.values);
  const computed = computeRating(values);

  const certificate = product.certificate?.id
    ? await prisma.certificate.findUnique({ where: { id: product.certificate.id } })
    : await ensureCertificate(product.id, product.userId);

  const csvBuffer = buildRatingCsvV1({
    productId: product.id,
    productName: product.name,
    values,
    computed,
  });
  const csvHash = sha256(csvBuffer);
  const csvKey = `ratings/RATING_${product.id}_${csvHash.slice(0, 12)}.csv`;

  let logoDataUrl: string | null = null;
  try {
    const logoBuf = await fs.readFile(path.join(process.cwd(), 'public', 'dpilogo-v3.png'));
    if (logoBuf?.length) {
      logoDataUrl = `data:image/png;base64,${logoBuf.toString('base64')}`;
    }
  } catch {
    logoDataUrl = null;
  }

  const ratingHtml = buildRatingPdfHtmlV1({
    productId: product.id,
    productName: product.name,
    processNumber: product.processNumber ?? null,
    logoDataUrl,
    criteria: RATING_CRITERIA_V1,
    values,
    computed,
  });
  const pdfBuffer = await renderHtmlToPdfBuffer(ratingHtml);
  const pdfHash = sha256(pdfBuffer);
  const pdfKey = `ratings/RATING_${product.id}_${pdfHash.slice(0, 12)}.pdf`;

  await Promise.all([
    saveBufferToS3({ key: csvKey, body: csvBuffer, contentType: 'text/csv; charset=utf-8' }),
    saveBufferToS3({ key: pdfKey, body: pdfBuffer, contentType: 'application/pdf' }),
  ]);

  await prisma.asset.upsert({
    where: { key: csvKey },
    update: {
      type: AssetType.OTHER,
      contentType: 'text/csv; charset=utf-8',
      sizeBytes: csvBuffer.length,
      sha256: csvHash,
      productId: product.id,
      userId: product.userId,
      certificateId: certificate?.id ?? null,
    },
    create: {
      key: csvKey,
      type: AssetType.OTHER,
      contentType: 'text/csv; charset=utf-8',
      sizeBytes: csvBuffer.length,
      sha256: csvHash,
      productId: product.id,
      userId: product.userId,
      certificateId: certificate?.id ?? null,
    },
  });

  await prisma.asset.upsert({
    where: { key: pdfKey },
    update: {
      type: AssetType.OTHER,
      contentType: 'application/pdf',
      sizeBytes: pdfBuffer.length,
      sha256: pdfHash,
      productId: product.id,
      userId: product.userId,
      certificateId: certificate?.id ?? null,
    },
    create: {
      key: pdfKey,
      type: AssetType.OTHER,
      contentType: 'application/pdf',
      sizeBytes: pdfBuffer.length,
      sha256: pdfHash,
      productId: product.id,
      userId: product.userId,
      certificateId: certificate?.id ?? null,
    },
  });

  const nowIso = new Date().toISOString();
  const prevSnapshot = ((product.certificate?.snapshotData as any) || {}) as any;
  const nextSnapshot = {
    ...prevSnapshot,
    ratingV1: {
      version: 'v1',
      values,
      computed,
      updatedAt: nowIso,
      csv: { key: csvKey, sha256: csvHash, updatedAt: nowIso },
      pdf: { key: pdfKey, sha256: pdfHash, updatedAt: nowIso },
      lockedAt: null,
      lockedByAdminId: null,
      passEmailSentAt: null,
      licenseReminderSentAt: null,
      licenseFinalReminderSentAt: null,
    },
  };

  // Persist snapshot + rating labels for seal generation
  const score = computed.overallGrade != null ? computed.overallGrade.toFixed(1) : null;
  const label = computed.overallCategory ?? null;

  await prisma.certificate.update({
    where: { id: certificate!.id },
    data: {
      snapshotData: nextSnapshot as any,
      ratingScore: score,
      ratingLabel: label,
    },
  });

  await logAdminAudit({
    adminId: admin.id,
    action: 'RATING_SHEET_SAVE',
    entityType: 'Product',
    entityId: product.id,
    productId: product.id,
    payload: { csvKey, csvHash, pdfKey, pdfHash, overallScore: score, overallLabel: label },
  });

  return NextResponse.json({
    ok: true,
    lockedAt: null,
    values,
    computed,
    csv: { key: csvKey, sha256: csvHash, updatedAt: nowIso },
    pdf: { key: pdfKey, sha256: pdfHash, updatedAt: nowIso },
  });
}
