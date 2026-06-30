import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from './prisma';

const TOKEN_BYTES = 32;
const TOKEN_TTL_HOURS = 48;

export const PrecheckInviteProductSchema = z.object({
  productName: z.string().trim().min(2),
  brand: z.string().trim().min(1),
  category: z.string().trim().min(1),
  code: z.string().trim().min(2),
  specs: z.string().trim().min(5),
  size: z.string().trim().optional(),
  madeIn: z.string().trim().optional(),
  material: z.string().trim().optional(),
});

export type PrecheckInviteProductData = z.infer<typeof PrecheckInviteProductSchema>;

export async function createPrecheckInvite(data: {
  email: string;
  contactName: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  company?: string | null;
  address?: string | null;
  productData: PrecheckInviteProductData;
  privacyAccepted: boolean;
}) {
  const token = crypto.randomBytes(TOKEN_BYTES).toString('hex');
  const tokenHash = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  const invite = await prisma.precheckInvite.create({
    data: {
      email: data.email,
      tokenHash,
      contactName: data.contactName,
      gender: data.gender,
      company: data.company || undefined,
      address: data.address || undefined,
      productData: data.productData,
      privacyAccepted: data.privacyAccepted,
      expiresAt,
    },
  });

  return { invite, token };
}

export async function findValidPrecheckInviteByToken(rawToken: string) {
  const token = rawToken.trim();
  if (!token) return null;

  const invites = await prisma.precheckInvite.findMany({
    where: {
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  for (const invite of invites) {
    const ok = await bcrypt.compare(token, invite.tokenHash);
    if (ok) return invite;
  }

  return null;
}

export function parsePrecheckInviteProductData(value: unknown) {
  return PrecheckInviteProductSchema.parse(value);
}
