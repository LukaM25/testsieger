import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { prisma } from './prisma';

const PREFIX = 'TC-2';

function buildProcessNumber(): string {
  const digits = Math.floor(1000 + Math.random() * 9000); // 4 random digits
  return `${PREFIX}${digits}`;
}

export async function ensureProcessNumber(productId: string): Promise<string> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { processNumber: true },
  });
  if (product?.processNumber) return product.processNumber;

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = buildProcessNumber();
    try {
      const updated = await prisma.product.update({
        where: { id: productId },
        data: { processNumber: candidate },
        select: { processNumber: true },
      });
      return updated.processNumber!;
    } catch (err: any) {
      const isUniqueViolation =
        err instanceof PrismaClientKnownRequestError && err.code === 'P2002';
      if (!isUniqueViolation) throw err;
      // Collision: retry with a new random number
    }
  }
  throw new Error('PROCESS_NUMBER_ASSIGN_FAILED');
}
