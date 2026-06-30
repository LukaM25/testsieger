import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DetailsSchema = z.object({
  productId: z.string().trim().min(1),
  company: z.string().trim().min(2),
  addressStreet: z.string().trim().min(2),
  addressNumber: z.string().trim().min(1),
  addressPostal: z.string().trim().min(3),
  addressCity: z.string().trim().min(2),
  addressCountry: z.string().trim().min(2),
  addressLine2: z.string().trim().optional(),
  dimensionLength: z.string().trim().min(1),
  dimensionWidth: z.string().trim().min(1),
  dimensionHeight: z.string().trim().min(1),
  madeIn: z.string().trim().min(2),
  material: z.string().trim().min(2),
});

function splitAddress(raw: string | null | undefined) {
  const cleaned = (raw || '').trim();
  if (!cleaned) {
    return {
      addressStreet: '',
      addressNumber: '',
      addressPostal: '',
      addressCity: '',
      addressCountry: 'Deutschland',
      addressLine2: '',
    };
  }

  const parts = cleaned.split(',').map((part) => part.trim());
  const streetMatch = (parts[0] || '').match(/^(.+?)\s+([^\s]+)$/);
  const cityMatch = (parts[1] || '').match(/^(\S+)\s+(.+)$/);

  return {
    addressStreet: streetMatch?.[1] || parts[0] || '',
    addressNumber: streetMatch?.[2] || '',
    addressPostal: cityMatch?.[1] || '',
    addressCity: cityMatch?.[2] || parts[1] || '',
    addressCountry: parts[parts.length - 1] || 'Deutschland',
    addressLine2: parts.length > 3 ? parts.slice(1, -2).join(', ') : '',
  };
}

function splitSize(raw: string | null | undefined) {
  const [dimensionLength = '', dimensionWidth = '', dimensionHeight = ''] = (raw || '').split('x');
  return { dimensionLength, dimensionWidth, dimensionHeight };
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });

  const url = new URL(req.url);
  const productId = url.searchParams.get('productId') || '';
  if (!productId) return NextResponse.json({ ok: false, error: 'MISSING_PRODUCT_ID' }, { status: 400 });

  const product = await prisma.product.findFirst({
    where: { id: productId, userId: session.userId },
    select: {
      id: true,
      name: true,
      brand: true,
      category: true,
      code: true,
      specs: true,
      size: true,
      madeIn: true,
      material: true,
      user: {
        select: {
          name: true,
          email: true,
          company: true,
          address: true,
        },
      },
    },
  });

  if (!product) return NextResponse.json({ ok: false, error: 'PRODUCT_NOT_FOUND' }, { status: 404 });

  return NextResponse.json({
    ok: true,
    product: {
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      code: product.code,
      specs: product.specs,
      madeIn: product.madeIn || '',
      material: product.material || '',
      ...splitSize(product.size),
    },
    user: {
      name: product.user.name,
      email: product.user.email,
      company: product.user.company || '',
      ...splitAddress(product.user.address),
    },
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });

  try {
    const data = DetailsSchema.parse(await req.json());
    const product = await prisma.product.findFirst({
      where: { id: data.productId, userId: session.userId },
      select: { id: true, name: true },
    });
    if (!product) return NextResponse.json({ ok: false, error: 'PRODUCT_NOT_FOUND' }, { status: 404 });

    const addressParts = [
      `${data.addressStreet} ${data.addressNumber}`.trim(),
      data.addressLine2?.trim(),
      `${data.addressPostal} ${data.addressCity}`.trim(),
      data.addressCountry.trim(),
    ].filter(Boolean);
    const address = addressParts.join(', ');
    const size = [data.dimensionLength, data.dimensionWidth, data.dimensionHeight]
      .map((value) => value.trim())
      .join('x');

    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.userId },
        data: {
          company: data.company,
          address,
        },
      }),
      prisma.product.update({
        where: { id: product.id },
        data: {
          size,
          madeIn: data.madeIn,
          material: data.material,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      redirect: `/precheck?productId=${product.id}&product=${encodeURIComponent(product.name)}`,
    });
  } catch (error: any) {
    if (error?.issues) {
      return NextResponse.json({ ok: false, errors: error.issues }, { status: 400 });
    }
    console.error('PRECHECK_DETAILS_SAVE_FAILED', error);
    return NextResponse.json({ ok: false, error: 'DETAILS_SAVE_FAILED' }, { status: 500 });
  }
}
