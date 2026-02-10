import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { setSession, getSession as getSessionCookie, clearSession } from './cookies';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const TOKEN_EXPIRY = '7d';

export async function loginUser(email: string, password: string) {
  const normalizedEmail = email.trim();
  const user = await prisma.user.findFirst({
    where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
  });
  if (!user || user.active === false || user.deletedAt) throw new Error('USER_NOT_FOUND');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('INVALID_PASSWORD');

  await setSession({ userId: user.id, email: user.email });
  return user;
}

export async function registerUser(data: { name: string; email: string; password: string }) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error('EMAIL_TAKEN');

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, passwordHash },
  });

  await setSession({ userId: user.id, email: user.email });
  return user;
}

export async function logoutUser() {
  await clearSession();
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}

export async function getSession() {
  const session = await getSessionCookie();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, active: true, deletedAt: true },
  });
  if (!user || user.active === false || user.deletedAt) {
    return null;
  }
  // Keep this helper side-effect free so it is safe in Server Components.
  // Session cookie refresh/rotation is handled by middleware and route handlers.
  return { userId: user.id, email: user.email };
}
