import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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
