import crypto from 'crypto';
import { uploadToS3, s3PublicUrl } from '../lib/s3';

async function main() {
  const key = `test/dummy-${Date.now()}.txt`;
  const body = Buffer.from(`hello s3 test ${crypto.randomUUID()}`);
  await uploadToS3({ key, body, contentType: 'text/plain' });
  console.log('Upload OK:', s3PublicUrl(key));
}

main().catch((err) => {
  console.error('Upload failed:', err?.message || err);
  process.exit(1);
});
