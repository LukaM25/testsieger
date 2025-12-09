#!/usr/bin/env node
// Assigns missing Vorgangsnummern (process numbers) in format TC-2xxxx to all products.
// Usage: node scripts/backfill-process-numbers.cjs

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function buildProcessNumber() {
  const digits = Math.floor(1000 + Math.random() * 9000); // 4 random digits
  return `TC-2${digits}`;
}

async function ensureProcessNumber(productId) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = buildProcessNumber();
    try {
      const updated = await prisma.product.update({
        where: { id: productId },
        data: { processNumber: candidate },
        select: { processNumber: true },
      });
      return updated.processNumber;
    } catch (err) {
      if (err?.code === 'P2002') continue; // collision, retry
      throw err;
    }
  }
  throw new Error(`Failed to assign processNumber for product ${productId}`);
}

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, processNumber: true } });
  let assigned = 0;
  for (const product of products) {
    if (product.processNumber) continue;
    const pn = await ensureProcessNumber(product.id);
    assigned++;
    console.log(`Assigned ${pn} to product ${product.id}`);
  }
  console.log(`Done. Assigned ${assigned} new Vorgangsnummern.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
