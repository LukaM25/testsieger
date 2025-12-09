import { readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import { ensureProcessNumber } from '../lib/processNumber';
import { sendPrecheckPaymentSuccess } from '../lib/email';

function loadEnv(path: string) {
  try {
    const content = readFileSync(path, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      const raw = line.slice(eq + 1).trim();
      const val = raw.replace(/^"/, '').replace(/"$/, '');
      if (key) process.env[key] = val;
    }
  } catch {
    // ignore missing files
  }
}

loadEnv('.env.local');
loadEnv('.env');

async function main() {
  const prisma = new PrismaClient();
  const product = await prisma.product.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { user: true },
  });

  if (!product || !product.user) {
    console.log('No product with user found. Aborting.');
    await prisma.$disconnect();
    return;
  }

  const processNumber = await ensureProcessNumber(product.id);
  await sendPrecheckPaymentSuccess({
    to: product.user.email,
    name: product.user.name,
    productName: product.name,
    processNumber,
    receiptPdf: undefined,
  });
  console.log(`Sent shipping info email to ${product.user.email} with Vorgangsnummer ${processNumber}`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  process.exitCode = 1;
});
