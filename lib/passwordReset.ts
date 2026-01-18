import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const TOKEN_BYTES = 32;
const TOKEN_TTL_MINUTES = 60; // 1 hour

export async function createResetToken(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null; // Avoid leaking user existence

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = crypto.randomBytes(TOKEN_BYTES).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  return { token, user };
}

export async function consumeResetToken(rawToken: string) {
  if (!rawToken || rawToken.length !== TOKEN_BYTES * 2) return null;

  const digest = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Fast path: deterministic match
  const now = new Date();
  const exact = await prisma.passwordResetToken.findFirst({
    where: { tokenHash: digest, expiresAt: { gt: now } },
    orderBy: { createdAt: 'desc' },
  });
  if (exact) {
    await prisma.passwordResetToken.deleteMany({ where: { userId: exact.userId } });
    return exact.userId;
  }

  // Backward compatibility: legacy bcrypt hashes (limit scope)
  const legacyTokens = await prisma.passwordResetToken.findMany({
    where: { expiresAt: { gt: now } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  for (const t of legacyTokens) {
    const ok = await bcrypt.compare(rawToken, t.tokenHash);
    if (ok) {
      await prisma.passwordResetToken.deleteMany({ where: { userId: t.userId } });
      return t.userId;
    }
  }

  return null;
}
