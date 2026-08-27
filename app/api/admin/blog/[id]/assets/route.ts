import { randomUUID } from 'node:crypto';

import { AdminRole, BlogAssetKind } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { logAdminAudit, requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { deleteKey, MAX_UPLOAD_BYTES, saveBufferToS3 } from '@/lib/storage';

export const runtime = 'nodejs';

const COVER_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

function safeFileName(value: string) {
  const cleaned = value.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned.slice(0, 120) || 'datei';
}

function hasValidSignature(buffer: Buffer, contentType: string) {
  if (contentType === 'application/pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  if (contentType === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (contentType === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (contentType === 'image/webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  if (contentType === 'image/avif') return buffer.subarray(4, 12).toString('ascii').startsWith('ftypavi');
  return false;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(AdminRole.SUPERADMIN).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { id: postId } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id: postId }, select: { id: true, slug: true } });
  if (!post) return NextResponse.json({ error: 'POST_NOT_FOUND' }, { status: 404 });

  const form = await req.formData();
  const file = form.get('file');
  const kind = form.get('kind') === BlogAssetKind.COVER ? BlogAssetKind.COVER : BlogAssetKind.ATTACHMENT;
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'FILE_REQUIRED' }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'FILE_TOO_LARGE' }, { status: 413 });
  }
  if (kind === BlogAssetKind.COVER && !COVER_MIMES.has(file.type)) {
    return NextResponse.json({ error: 'COVER_MUST_BE_IMAGE' }, { status: 400 });
  }
  if (kind === BlogAssetKind.ATTACHMENT && file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'ATTACHMENT_MUST_BE_PDF' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasValidSignature(buffer, file.type)) {
    return NextResponse.json({ error: 'INVALID_FILE_CONTENT' }, { status: 400 });
  }

  const fileName = safeFileName(file.name);
  const key = `blog/${postId}/${randomUUID()}-${fileName}`;
  await saveBufferToS3({ key, body: buffer, contentType: file.type });

  const oldCovers = kind === BlogAssetKind.COVER
    ? await prisma.blogAsset.findMany({ where: { postId, kind: BlogAssetKind.COVER } })
    : [];

  const asset = await prisma.$transaction(async (tx) => {
    if (kind === BlogAssetKind.COVER) {
      await tx.blogAsset.deleteMany({ where: { postId, kind: BlogAssetKind.COVER } });
    }
    return tx.blogAsset.create({
      data: { postId, kind, key, fileName, contentType: file.type, sizeBytes: file.size },
    });
  });
  await Promise.allSettled(oldCovers.map((old) => deleteKey(old.key)));

  await logAdminAudit({
    adminId: admin.id,
    action: kind === BlogAssetKind.COVER ? 'BLOG_COVER_UPLOAD' : 'BLOG_ATTACHMENT_UPLOAD',
    entityType: 'BlogPost',
    entityId: postId,
    payload: { assetId: asset.id, fileName: asset.fileName, sizeBytes: asset.sizeBytes },
  });

  revalidatePath('/blog');
  revalidatePath(`/blog/${post.slug}`);
  return NextResponse.json({ ok: true, asset }, { status: 201 });
}
