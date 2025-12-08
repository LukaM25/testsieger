import { AdminRole } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

const ADMIN_COOKIE = 'admin_token';
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12; // 12h

const ROLE_RANK: Record<AdminRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  SUPERADMIN: 2,
};

type AdminSessionPayload = {
  adminId: string;
  role: AdminRole;
  email: string;
};

function getAdminSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error('Missing ADMIN_JWT_SECRET');
  return secret;
}

export async function setAdminSession(admin: { id: string; email: string; role: AdminRole }) {
  const token = jwt.sign(
    { adminId: admin.id, email: admin.email, role: admin.role } satisfies AdminSessionPayload,
    getAdminSecret(),
    { expiresIn: ADMIN_SESSION_MAX_AGE },
  );

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0 });
}

export function hasRequiredRole(role: AdminRole, required: AdminRole) {
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

async function readSessionFromCookie(): Promise<AdminSessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, getAdminSecret()) as AdminSessionPayload;
  } catch (err) {
    console.warn('ADMIN_TOKEN_INVALID', err);
    return null;
  }
}

export type AdminContext = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
};

export async function getAdminContext(): Promise<AdminContext | null> {
  const payload = await readSessionFromCookie();
  if (!payload) return null;

  const admin = await prisma.admin.findUnique({
    where: { id: payload.adminId },
    select: { id: true, email: true, name: true, role: true, active: true, revokedAt: true },
  });
  if (!admin || !admin.active || admin.revokedAt) return null;

  return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
}

export async function isAdminAuthed(requiredRole: AdminRole = AdminRole.SUPERADMIN) {
  const admin = await getAdminContext();
  if (!admin) return false;
  return hasRequiredRole(admin.role, requiredRole);
}

export async function requireAdmin(requiredRole: AdminRole = AdminRole.SUPERADMIN) {
  const admin = await getAdminContext();
  if (!admin || !hasRequiredRole(admin.role, requiredRole)) {
    throw new Error('UNAUTHORIZED_ADMIN');
  }
  return admin;
}

export async function logAdminAudit(entry: {
  adminId: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  productId?: string | null;
  payload?: unknown;
}) {
  try {
    await prisma.adminAudit.create({
      data: {
        adminId: entry.adminId,
        action: entry.action,
        entityType: entry.entityType ?? null,
        entityId: entry.entityId ?? null,
        productId: entry.productId ?? null,
        payload: entry.payload as any,
      },
    });
  } catch (err) {
    console.error('ADMIN_AUDIT_ERROR', err);
  }
}
