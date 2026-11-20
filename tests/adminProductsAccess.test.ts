import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminRole } from '@prisma/client';
import jwt from 'jsonwebtoken';

const mocks = vi.hoisted(() => ({
  cookies: new Map<string, string>(),
  adminFindUnique: vi.fn(),
  connect: vi.fn(),
  productFindMany: vi.fn(),
  productCount: vi.fn(),
  productGroupBy: vi.fn(),
  orderFindMany: vi.fn(),
  auditFindMany: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = mocks.cookies.get(name);
      return value === undefined ? undefined : { value };
    },
  }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    admin: { findUnique: mocks.adminFindUnique },
    $connect: mocks.connect,
    product: {
      findMany: mocks.productFindMany,
      count: mocks.productCount,
      groupBy: mocks.productGroupBy,
    },
    order: { findMany: mocks.orderFindMany },
    adminAudit: { findMany: mocks.auditFindMany },
  },
}));

vi.mock('@/lib/s3', () => ({ ensureSignedS3Url: vi.fn() }));
vi.mock('@/lib/certificateAssets', () => ({ getCertificateAssetLinks: vi.fn() }));

import { GET as legacyGet } from '../app/admin/products/route';
import { GET as apiGet } from '../app/api/admin/products/route';

const ADMIN_SECRET = 'admin-products-test-secret-only';
const CUSTOMER_SECRET = 'customer-products-test-secret-only';
const admin = {
  id: 'admin-test',
  email: 'admin@example.test',
  name: 'Test Admin',
  role: AdminRole.VIEWER,
  active: true,
  revokedAt: null,
};

function signAdminToken(payload: Record<string, unknown> = {}, secret = ADMIN_SECRET) {
  return jwt.sign({
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...payload,
  }, secret);
}

describe.each([
  ['/admin/products', legacyGet],
  ['/api/admin/products', apiGet],
] as const)('%s access control', (url, get) => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.cookies.clear();
    vi.stubEnv('ADMIN_JWT_SECRET', ADMIN_SECRET);
    vi.stubEnv('JWT_SECRET', CUSTOMER_SECRET);
    vi.stubEnv('ADMIN_DB_BYPASS', 'false');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.adminFindUnique.mockResolvedValue(admin);
    mocks.connect.mockResolvedValue(undefined);
    mocks.productFindMany.mockResolvedValue([]);
    mocks.productCount.mockResolvedValue(0);
    mocks.productGroupBy.mockResolvedValue([]);
    mocks.orderFindMany.mockResolvedValue([]);
    mocks.auditFindMany.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  const request = () => new Request(`http://test.local${url}`);

  async function expectBlocked() {
    const response = await get(request());
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'UNAUTHORIZED' });
    expect(mocks.connect).not.toHaveBeenCalled();
    expect(mocks.productFindMany).not.toHaveBeenCalled();
    expect(mocks.productCount).not.toHaveBeenCalled();
    expect(mocks.productGroupBy).not.toHaveBeenCalled();
    expect(mocks.orderFindMany).not.toHaveBeenCalled();
    expect(mocks.auditFindMany).not.toHaveBeenCalled();
  }

  it('blocks visitors before querying customer data', async () => {
    await expectBlocked();
    expect(mocks.adminFindUnique).not.toHaveBeenCalled();
  });

  it('blocks customers with a valid customer session', async () => {
    mocks.cookies.set('tc_session', jwt.sign({ userId: 'customer-test' }, CUSTOMER_SECRET));
    await expectBlocked();
    expect(mocks.adminFindUnique).not.toHaveBeenCalled();
  });

  it('rejects an admin token signed with the customer secret', async () => {
    mocks.cookies.set('admin_token', signAdminToken({}, CUSTOMER_SECRET));
    await expectBlocked();
    expect(mocks.adminFindUnique).not.toHaveBeenCalled();
  });

  it('rejects expired admin tokens', async () => {
    mocks.cookies.set('admin_token', signAdminToken({ exp: 1 }));
    await expectBlocked();
  });

  it.each([
    ['deleted', null],
    ['disabled', { ...admin, active: false }],
    ['revoked', { ...admin, revokedAt: new Date() }],
    ['invalid role', { ...admin, role: 'CUSTOMER' }],
  ])('blocks an admin with %s access', async (_label, record) => {
    mocks.cookies.set('admin_token', signAdminToken());
    mocks.adminFindUnique.mockResolvedValue(record);
    await expectBlocked();
  });

  it.each(Object.values(AdminRole))('allows an active %s and excludes sensitive user fields', async (role) => {
    mocks.cookies.set('admin_token', signAdminToken());
    mocks.adminFindUnique.mockResolvedValue({ ...admin, role });
    const user = {
      id: 'customer-test',
      name: 'Test Customer',
      gender: null,
      company: 'Test Company',
      email: 'customer@example.test',
      address: 'Test Address',
      passwordHash: 'must-never-be-returned',
      active: true,
      deletedAt: null,
    };
    mocks.productFindMany.mockImplementation(async ({ select }) => {
      expect(select.user).toEqual({
        select: { name: true, gender: true, company: true, email: true, address: true },
      });
      const selectedUser = Object.fromEntries(
        Object.keys(select.user.select).map((field) => [field, user[field as keyof typeof user]]),
      );
      return [{
        id: 'product-test',
        name: 'Test Product',
        brand: 'Test Brand',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        user: selectedUser,
        certificate: null,
        license: null,
      }];
    });
    mocks.productCount.mockResolvedValue(1);

    const response = await get(request());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.products).toHaveLength(1);
    expect(body.products[0].user).toEqual({
      name: user.name,
      gender: user.gender,
      company: user.company,
      email: user.email,
      address: user.address,
    });
    expect(JSON.stringify(body)).not.toContain('passwordHash');
    expect(JSON.stringify(body)).not.toContain(user.passwordHash);
  });
});
