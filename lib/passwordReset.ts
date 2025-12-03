import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const TOKEN_BYTES = 32;
const TOKEN_TTL_MINUTES = 60; // 1 hour

export async function createResetToken(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null; // Avoid leaking user existence

  const token = crypto.randomBytes(TOKEN_BYTES).toString('hex');
  const tokenHash = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  return { token, user };
}

export async function consumeResetToken(rawToken: string) {
  // Find non-expired tokens and compare hashes to avoid storing raw tokens
  const tokens = await prisma.passwordResetToken.findMany({
    where: { expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  for (const t of tokens) {
    const ok = await bcrypt.compare(rawToken, t.tokenHash);
    if (ok) {
      await prisma.passwordResetToken.deleteMany({ where: { userId: t.userId } });
      return t.userId;
    }
  }

  return null;
}
