import crypto from 'crypto';
import { AssetType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { officialPdfKey, qrKey } from '@/lib/assetKeys';
import { MAX_UPLOAD_BYTES, saveBufferToS3, signedUrlForKey } from '@/lib/storage';

const PDF_MIME = 'application/pdf';
const PNG_MIME = 'image/png';
const SIGNED_URL_FALLBACK = 'SIGNED_URL_UNAVAILABLE';

function validateBufferForType(buffer: Buffer, contentType: string, allowedTypes: string[]) {
  if (!buffer || buffer.length === 0) {
    throw new Error('Empty upload buffer');
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error('File too large');
  }
  if (!allowedTypes.includes(contentType)) {
    throw new Error('Unsupported MIME type');
  }
}

async function signOrFallback(key: string) {
  try {
    return await signedUrlForKey(key);
  } catch (err) {
    console.error('SIGNED_URL_FAILED', { key, error: err });
    return SIGNED_URL_FALLBACK;
  }
}

export async function storeCertificateAssets({
  certificateId,
  productId,
  userId,
  sealNumber,
  pdfBuffer,
  qrBuffer,
}: {
  certificateId: string;
  productId: string;
  userId: string;
  sealNumber: string;
  pdfBuffer: Buffer;
  qrBuffer: Buffer;
}) {
  validateBufferForType(pdfBuffer, PDF_MIME, [PDF_MIME]);
  validateBufferForType(qrBuffer, PNG_MIME, [PNG_MIME]);

  const pdfKey = officialPdfKey(sealNumber);
  const qrKeyStr = qrKey(sealNumber);

  await saveBufferToS3({
    key: pdfKey,
    body: pdfBuffer,
    contentType: PDF_MIME,
  });

  await saveBufferToS3({
    key: qrKeyStr,
    body: qrBuffer,
    contentType: PNG_MIME,
  });

  const pdfHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
  const qrHash = crypto.createHash('sha256').update(qrBuffer).digest('hex');

  await prisma.asset.createMany({
    data: [
      {
        type: AssetType.OFFICIAL_PDF,
        key: pdfKey,
        contentType: 'application/pdf',
        sizeBytes: pdfBuffer.length,
        sha256: pdfHash,
        certificateId,
        productId,
        userId,
      },
      {
        type: AssetType.CERTIFICATE_QR,
        key: qrKeyStr,
        contentType: 'image/png',
        sizeBytes: qrBuffer.length,
        sha256: qrHash,
        certificateId,
        productId,
        userId,
      },
    ],
    skipDuplicates: true,
  });

  // Refresh hashes/metadata for existing assets in case they already exist
  await prisma.asset.updateMany({
    where: { key: pdfKey },
    data: {
      type: AssetType.OFFICIAL_PDF,
      contentType: 'application/pdf',
      sizeBytes: pdfBuffer.length,
      sha256: pdfHash,
      certificateId,
      productId,
      userId,
    },
  });

  await prisma.asset.updateMany({
    where: { key: qrKeyStr },
    data: {
      type: AssetType.CERTIFICATE_QR,
      contentType: 'image/png',
      sizeBytes: qrBuffer.length,
      sha256: qrHash,
      certificateId,
      productId,
      userId,
    },
  });

  const pdfSigned = await signOrFallback(pdfKey);
  const qrSigned = await signOrFallback(qrKeyStr);

  await prisma.certificate.update({
    where: { id: certificateId },
    data: {
      pdfUrl: pdfSigned,
      qrUrl: qrSigned,
    },
  });

  return {
    pdfKey,
    qrKey: qrKeyStr,
    pdfSigned,
    qrSigned,
  };
}

export async function getCertificateAssetLinks(certificateId: string) {
  const assets = await prisma.asset.findMany({
    where: { certificateId },
  });

  const signedEntries = await Promise.all(
    assets.map(async (asset) => [asset.type, await signOrFallback(asset.key)] as const),
  );

  const output: Partial<Record<AssetType, string>> = {};
  for (const [type, url] of signedEntries) {
    output[type] = url;
  }

  return output;
}
