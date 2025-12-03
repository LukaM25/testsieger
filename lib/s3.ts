import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    : undefined, // will use instance role if deployed with IAM role
});

export async function uploadToS3(params: { key: string; body: Buffer; contentType: string }) {
  const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET_NAME;
  if (!bucket) throw new Error('Missing S3 bucket env (S3_BUCKET or AWS_S3_BUCKET_NAME)');
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType,
    ACL: 'private', // keep private, serve with signed URLs
  });
  await s3.send(command);
  return `s3://${bucket}/${params.key}`;
}

export function s3PublicUrl(key: string) {
  const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  if (!bucket) throw new Error('Missing S3 bucket env (S3_BUCKET or AWS_S3_BUCKET_NAME)');
  if (!region) throw new Error('Missing AWS_REGION env');
  // Virtual-hosted–style URL
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export async function signedS3Url(key: string, expiresInSeconds = 60 * 30) {
  const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET_NAME;
  if (!bucket) throw new Error('Missing S3 bucket env (S3_BUCKET or AWS_S3_BUCKET_NAME)');
  const region = process.env.AWS_REGION;
  if (!region) throw new Error('Missing AWS_REGION env');
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
    { expiresIn: expiresInSeconds }
  );
}

export async function ensureSignedS3Url(url?: string | null, expiresInSeconds = 60 * 30) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has('X-Amz-Signature')) return url;

    const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    if (!bucket || !region) return url;

    const expectedHost = `${bucket}.s3.${region}.amazonaws.com`;
    if (parsed.hostname !== expectedHost) return url;

    const key = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
    return signedS3Url(key, expiresInSeconds);
  } catch {
    return url;
  }
}
