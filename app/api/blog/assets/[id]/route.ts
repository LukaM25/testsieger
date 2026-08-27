import { AdminRole, BlogAssetKind, BlogPostStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

import { getAdminContext, hasRequiredRole } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { getObjectBuffer } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function contentDisposition(fileName: string, inline: boolean) {
  const encoded = encodeURIComponent(fileName);
  return `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encoded}`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = await prisma.blogAsset.findUnique({
    where: { id },
    include: { post: { select: { status: true } } },
  });
  if (!asset) return NextResponse.json({ error: 'ASSET_NOT_FOUND' }, { status: 404 });

  const published = asset.post.status === BlogPostStatus.PUBLISHED;
  if (!published) {
    const admin = await getAdminContext();
    if (!admin || !hasRequiredRole(admin.role, AdminRole.SUPERADMIN)) {
      return NextResponse.json({ error: 'ASSET_NOT_FOUND' }, { status: 404 });
    }
  }

  try {
    const buffer = await getObjectBuffer(asset.key);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': asset.contentType,
        'Content-Length': String(buffer.length),
        'Content-Disposition': contentDisposition(asset.fileName, asset.kind === BlogAssetKind.COVER),
        'Cache-Control': published ? 'public, max-age=3600, stale-while-revalidate=86400' : 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('BLOG_ASSET_READ_ERROR', error);
    return NextResponse.json({ error: 'ASSET_UNAVAILABLE' }, { status: 404 });
  }
}
