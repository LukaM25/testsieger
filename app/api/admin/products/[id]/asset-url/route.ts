import { NextResponse } from 'next/server';
import { AdminRole } from '@prisma/client';

import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { ensureSignedS3Url } from '@/lib/s3';
import { signedUrlForKey } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function extractKeyFromS3Uri(uri: string) {
  // s3://bucket/key
  const m = uri.match(/^s3:\/\/[^/]+\/(.+)$/i);
  return m ? m[1] : null;
}

async function toSignedUrl(urlOrKey: string) {
  const trimmed = urlOrKey.trim();
  const keyFromS3 = extractKeyFromS3Uri(trimmed);
  if (keyFromS3) return signedUrlForKey(keyFromS3);

  if (/^https?:\/\//i.test(trimmed)) {
    return (await ensureSignedS3Url(trimmed)) ?? trimmed;
  }

  return signedUrlForKey(trimmed);
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(AdminRole.EXAMINER).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { id: productId } = await params;
  const url = new URL(req.url);
  const kind = (url.searchParams.get('kind') || '').trim();
  const redirect = (url.searchParams.get('redirect') || '').trim() === '1';
  if (!productId) return NextResponse.json({ error: 'MISSING_PRODUCT_ID' }, { status: 400 });
  if (!kind) return NextResponse.json({ error: 'MISSING_KIND' }, { status: 400 });

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      certificate: { select: { reportUrl: true, sealUrl: true, pdfUrl: true, qrUrl: true } },
    },
  });
  if (!product) return NextResponse.json({ error: 'PRODUCT_NOT_FOUND' }, { status: 404 });

  const cert = product.certificate;
  if (!cert) return NextResponse.json({ error: 'CERTIFICATE_NOT_FOUND' }, { status: 404 });

  let source: string | null = null;
  if (kind === 'report') source = cert.reportUrl ?? null;
  if (kind === 'seal') source = cert.sealUrl ?? null;
  if (kind === 'pdf') source = cert.pdfUrl ?? null;
  if (kind === 'qr') source = cert.qrUrl ?? null;

  if (!source) return NextResponse.json({ error: 'ASSET_NOT_FOUND' }, { status: 404 });

  try {
    const signed = await toSignedUrl(source);
    if (redirect) {
      return NextResponse.redirect(signed);
    }
    return NextResponse.json({ ok: true, url: signed });
  } catch (err) {
    console.error('ASSET_SIGN_ERROR', { productId, kind, err });
    return NextResponse.json({ error: 'FAILED_TO_SIGN' }, { status: 500 });
  }
}
