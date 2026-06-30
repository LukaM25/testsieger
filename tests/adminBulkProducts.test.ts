import { beforeEach, describe, expect, it, vi } from 'vitest';

const admin = { id: 'admin_super', role: 'SUPERADMIN', email: 'super@example.test' };
const customer = {
  id: 'user_customer',
  name: 'Customer Example',
  email: 'customer@example.test',
  company: 'Example GmbH',
  active: true,
  deletedAt: null,
};

const requireAdminMock = vi.fn(async () => admin);
const userFindManyMock = vi.fn();
const userFindUniqueMock = vi.fn();
const productCreateMock = vi.fn();
const auditCreateMock = vi.fn();
const transactionMock = vi.fn(async (callback: (tx: any) => unknown) =>
  callback({
    user: { findUnique: userFindUniqueMock },
    product: { create: productCreateMock },
    adminAudit: { create: auditCreateMock },
  }),
);

vi.mock('@/lib/admin', () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findMany: userFindManyMock },
    $transaction: transactionMock,
  },
}));

describe('Superadmin customer product creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue(admin);
    userFindUniqueMock.mockResolvedValue(customer);
    productCreateMock
      .mockResolvedValueOnce({
        id: 'product_one',
        name: 'Product One',
        brand: 'Example',
        createdAt: new Date('2026-06-30T10:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        id: 'product_two',
        name: 'Product Two',
        brand: 'Example',
        createdAt: new Date('2026-06-30T10:01:00.000Z'),
      });
    auditCreateMock.mockResolvedValue({ id: 'audit_one' });
  });

  it('searches customers by email and reports their product count', async () => {
    userFindManyMock.mockResolvedValue([
      {
        ...customer,
        _count: { products: 4 },
      },
    ]);
    const { GET } = await import('../app/api/admin/users/route');

    const response = await GET(
      new Request('http://test.local/api/admin/users?email=customer%40example.test'),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(userFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: { contains: 'customer@example.test', mode: 'insensitive' } },
        take: 10,
      }),
    );
    expect(json.users).toEqual([
      expect.objectContaining({
        id: customer.id,
        email: customer.email,
        active: true,
        productCount: 4,
      }),
    ]);
  });

  it('creates multiple PRECHECK products atomically and records a batch audit', async () => {
    const { POST } = await import('../app/api/admin/products/bulk/route');
    const response = await POST(
      new Request('http://test.local/api/admin/products/bulk', {
        method: 'POST',
        body: JSON.stringify({
          userId: customer.id,
          products: [
            { productName: 'Product One', brand: 'Example', category: 'Fitness' },
            { productName: 'Product Two', brand: 'Example', code: 'SKU-2' },
          ],
        }),
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.products).toHaveLength(2);
    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(productCreateMock).toHaveBeenCalledTimes(2);
    expect(productCreateMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          userId: customer.id,
          name: 'Product One',
          status: 'PRECHECK',
          adminProgress: 'PRECHECK',
          paymentStatus: 'UNPAID',
        }),
      }),
    );
    expect(auditCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminId: admin.id,
        action: 'CUSTOMER_PRODUCTS_BULK_CREATE',
        entityType: 'User',
        entityId: customer.id,
        payload: expect.objectContaining({
          customerEmail: customer.email,
          count: 2,
          products: [
            expect.objectContaining({ id: 'product_one' }),
            expect.objectContaining({ id: 'product_two' }),
          ],
        }),
      }),
    });
  });

  it('rejects inactive customers without creating products', async () => {
    userFindUniqueMock.mockResolvedValue({ ...customer, active: false });
    const { POST } = await import('../app/api/admin/products/bulk/route');

    const response = await POST(
      new Request('http://test.local/api/admin/products/bulk', {
        method: 'POST',
        body: JSON.stringify({
          userId: customer.id,
          products: [{ productName: 'Product One', brand: 'Example' }],
        }),
      }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'CUSTOMER_INACTIVE' });
    expect(productCreateMock).not.toHaveBeenCalled();
    expect(auditCreateMock).not.toHaveBeenCalled();
  });

  it('requires a Superadmin session', async () => {
    requireAdminMock.mockResolvedValueOnce(null);
    const { POST } = await import('../app/api/admin/products/bulk/route');

    const response = await POST(
      new Request('http://test.local/api/admin/products/bulk', {
        method: 'POST',
        body: JSON.stringify({
          userId: customer.id,
          products: [{ productName: 'Product One', brand: 'Example' }],
        }),
      }),
    );

    expect(response.status).toBe(401);
    expect(transactionMock).not.toHaveBeenCalled();
  });
});
