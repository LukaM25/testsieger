import { AdminRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { logAdminAudit, requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { deleteKey } from '@/lib/storage';

export const runtime = 'nodejs';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> },
) {
  const admin = await requireAdmin(AdminRole.SUPERADMIN).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { id: postId, assetId } = await params;
  const asset = await prisma.blogAsset.findFirst({
    where: { id: assetId, postId },
    include: { post: { select: { slug: true } } },
  });
  if (!asset) return NextResponse.json({ error: 'ASSET_NOT_FOUND' }, { status: 404 });

  await prisma.blogAsset.delete({ where: { id: asset.id } });
  await deleteKey(asset.key).catch((error) => console.error('BLOG_ASSET_DELETE_ERROR', error));
  await logAdminAudit({
    adminId: admin.id,
    action: 'BLOG_ASSET_DELETE',
    entityType: 'BlogPost',
    entityId: postId,
    payload: { assetId, fileName: asset.fileName },
  });

  revalidatePath('/blog');
  revalidatePath(`/blog/${asset.post.slug}`);
  return NextResponse.json({ ok: true });
}
