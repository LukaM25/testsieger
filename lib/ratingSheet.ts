import { prisma } from '@/lib/prisma';
import { getObjectBuffer } from '@/lib/storage';

export type RatingCsvAttachment = {
  buffer: Buffer;
  key: string;
  sha256?: string | null;
};

export type RatingPdfAttachment = {
  buffer: Buffer;
  key: string;
  sha256?: string | null;
};

function getRatingFromSnapshot(snapshotData: unknown) {
  const snap = (snapshotData || {}) as any;
  const rating = snap?.ratingV1;
  const csvKey = typeof rating?.csv?.key === 'string' ? (rating.csv.key as string) : null;
  const csvSha256 = typeof rating?.csv?.sha256 === 'string' ? (rating.csv.sha256 as string) : null;
  const pdfKey = typeof rating?.pdf?.key === 'string' ? (rating.pdf.key as string) : null;
  const pdfSha256 = typeof rating?.pdf?.sha256 === 'string' ? (rating.pdf.sha256 as string) : null;
  const lockedAt = typeof rating?.lockedAt === 'string' ? rating.lockedAt : null;
  const passEmailSentAt = typeof rating?.passEmailSentAt === 'string' ? rating.passEmailSentAt : null;
  return { csvKey, csvSha256, pdfKey, pdfSha256, lockedAt, passEmailSentAt };
}

export async function fetchStoredRatingCsvAttachment(productId: string): Promise<RatingCsvAttachment | null> {
  const cert = await prisma.certificate.findUnique({
    where: { productId },
    select: { snapshotData: true },
  });
  const { csvKey, csvSha256 } = getRatingFromSnapshot(cert?.snapshotData);
  if (!csvKey) return null;
  const buffer = await getObjectBuffer(csvKey).catch(() => null);
  if (!buffer || buffer.length === 0) return null;
  return { buffer, key: csvKey, sha256: csvSha256 };
}

export async function fetchStoredRatingPdfAttachment(productId: string): Promise<RatingPdfAttachment | null> {
  const cert = await prisma.certificate.findUnique({
    where: { productId },
    select: { snapshotData: true },
  });
  const { pdfKey, pdfSha256 } = getRatingFromSnapshot(cert?.snapshotData);
  if (!pdfKey) return null;
  const buffer = await getObjectBuffer(pdfKey).catch(() => null);
  if (!buffer || buffer.length === 0) return null;
  return { buffer, key: pdfKey, sha256: pdfSha256 };
}

export async function getRatingLockState(productId: string) {
  const cert = await prisma.certificate.findUnique({
    where: { productId },
    select: { snapshotData: true },
  });
  const { lockedAt, passEmailSentAt } = getRatingFromSnapshot(cert?.snapshotData);
  return { lockedAt, passEmailSentAt };
}
