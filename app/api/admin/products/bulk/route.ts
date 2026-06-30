import { AdminRole, Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const OptionalProductField = z.string().trim().max(2000).optional().default('');

export const BulkProductSchema = z.object({
  userId: z.string().trim().min(1),
  products: z
    .array(
      z.object({
        productName: z.string().trim().min(2).max(200),
        brand: z.string().trim().min(1).max(200),
        category: OptionalProductField,
        code: OptionalProductField,
        specs: OptionalProductField,
        size: OptionalProductField,
        madeIn: OptionalProductField,
        material: OptionalProductField,
      }),
    )
    .min(1)
    .max(50),
});

const optionalValue = (value: string) => value || null;

export async function POST(request: Request) {
  const admin = await requireAdmin(AdminRole.SUPERADMIN).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  let input: z.infer<typeof BulkProductSchema>;
  try {
    input = BulkProductSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'INVALID_INPUT', issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: input.userId },
        select: { id: true, name: true, email: true, active: true, deletedAt: true },
      });
      if (!user) throw new Error('CUSTOMER_NOT_FOUND');
      if (!user.active || user.deletedAt) throw new Error('CUSTOMER_INACTIVE');

      const products: Array<{ id: string; name: string; brand: string; createdAt: Date }> = [];
      for (const item of input.products) {
        const product = await tx.product.create({
          data: {
            userId: user.id,
            name: item.productName,
            brand: item.brand,
            category: optionalValue(item.category),
            code: optionalValue(item.code),
            specs: optionalValue(item.specs),
            size: optionalValue(item.size),
            madeIn: optionalValue(item.madeIn),
            material: optionalValue(item.material),
            status: 'PRECHECK',
            adminProgress: 'PRECHECK',
            paymentStatus: 'UNPAID',
          },
          select: { id: true, name: true, brand: true, createdAt: true },
        });
        products.push(product);
      }

      await tx.adminAudit.create({
        data: {
          adminId: admin.id,
          action: 'CUSTOMER_PRODUCTS_BULK_CREATE',
          entityType: 'User',
          entityId: user.id,
          payload: {
            customerEmail: user.email,
            count: products.length,
            products: products.map((product) => ({
              id: product.id,
              name: product.name,
              brand: product.brand,
            })),
          } satisfies Prisma.InputJsonValue,
        },
      });

      return { user, products };
    });

    return NextResponse.json({
      ok: true,
      customer: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
      products: result.products.map((product) => ({
        ...product,
        createdAt: product.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'CUSTOMER_NOT_FOUND') {
      return NextResponse.json({ error: 'CUSTOMER_NOT_FOUND' }, { status: 404 });
    }
    if (error instanceof Error && error.message === 'CUSTOMER_INACTIVE') {
      return NextResponse.json({ error: 'CUSTOMER_INACTIVE' }, { status: 409 });
    }
    console.error('CUSTOMER_PRODUCTS_BULK_CREATE_FAILED', error);
    return NextResponse.json({ error: 'PRODUCT_CREATE_FAILED' }, { status: 500 });
  }
}
