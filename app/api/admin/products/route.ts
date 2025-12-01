import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { isAdminAuthed } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  const authed = await isAdminAuthed();
  if (!authed) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  // Optional bypass for offline dev or unreachable DB
  if (process.env.ADMIN_DB_BYPASS === 'true') {
    return NextResponse.json(
      {
        products: [],
        warning:
          'Datenbank-Zugriff ist deaktiviert (ADMIN_DB_BYPASS). Liste bleibt leer, bitte später erneut versuchen.',
      },
      { status: 200 },
    );
  }

  // Early connectivity check to avoid bubbling Prisma init errors
  try {
    await prisma.$connect();
  } catch (err) {
    console.error('Prisma connection failed before query', err);
    return NextResponse.json(
      {
        products: [],
        warning:
          'Datenbank aktuell nicht erreichbar. Die Liste ist leer, bitte später erneut versuchen.',
      },
      { status: 200 },
    );
  }

  try {
    const products = await prisma.product.findMany({
      include: {
        user: true,
        certificate: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const payload = products.map((product) => ({
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      code: product.code,
      specs: product.specs,
      size: product.size,
      madeIn: product.madeIn,
      material: product.material,
      status: product.status,
      adminProgress: product.adminProgress,
      paymentStatus: product.paymentStatus,
      createdAt: product.createdAt.toISOString(),
      user: {
        name: product.user.name,
        company: product.user.company,
        email: product.user.email,
        address: product.user.address,
      },
      certificate: product.certificate
        ? {
            id: product.certificate.id,
            pdfUrl: product.certificate.pdfUrl,
            qrUrl: product.certificate.qrUrl,
            seal_number: product.certificate.seal_number,
            externalReferenceId: product.certificate.externalReferenceId,
            ratingScore: product.certificate.ratingScore,
            ratingLabel: product.certificate.ratingLabel,
            sealUrl: product.certificate.sealUrl,
          }
        : null,
    }));

    return NextResponse.json({ products: payload });
  } catch (error) {
    console.error('Failed to load products from database', error);
    // Gracefully degrade for any failure: return empty list with warning.
    return NextResponse.json(
      {
        products: [],
        warning:
          'Datenbank aktuell nicht erreichbar. Die Liste ist leer, bitte später erneut versuchen.',
      },
      { status: 200 },
    );
  }
}
