import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB

function bucket() {
  const b = process.env.S3_BUCKET ?? process.env.AWS_S3_BUCKET_NAME;
  if (!b) throw new Error('Missing bucket env');
  return b;
}

function region() {
  const r = process.env.AWS_REGION;
  if (!r) throw new Error('Missing AWS_REGION');
  return r;
}

export const s3 = new S3Client({
  region: region(),
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    : undefined,
});

/**
 * Validate before uploading
 */
function validateUpload(body: Buffer | Uint8Array, contentType: string) {
  if (!body || body.length === 0) throw new Error('Empty upload');
  if (body.length > MAX_UPLOAD_BYTES) throw new Error('File too large');
  if (!contentType) throw new Error('Missing MIME');
}

/**
 * Upload with retry/backoff and strict privacy
 */
export async function saveBufferToS3({
  key,
  body,
  contentType,
}: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}) {
  validateUpload(body, contentType);

  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: 'private',
  });

  let lastErr;
  for (let i = 0; i < 3; i++) {
    try {
      await s3.send(command);
      return;
    } catch (err) {
      lastErr = err;
      await new Promise((res) => setTimeout(res, 200 * (i + 1)));
    }
  }

  console.error('S3 upload failed', { key, error: lastErr });
  throw lastErr;
}

export async function signedUrlForKey(key: string, ttl = 60 * 15) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket(), Key: key }),
    { expiresIn: ttl }
  );
}

export async function deleteKey(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}
