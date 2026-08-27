import { AdminRole, BlogPostStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { logAdminAudit, requireAdmin } from '@/lib/admin';
import { trimOptional, uniqueBlogSlug } from '@/lib/blog';
import { prisma } from '@/lib/prisma';
import { deleteKey } from '@/lib/storage';

export const runtime = 'nodejs';

const postInclude = {
  author: { select: { id: true, name: true, email: true } },
  assets: { orderBy: { createdAt: 'asc' as const } },
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(AdminRole.SUPERADMIN).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'POST_NOT_FOUND' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 180) : existing.title;
  const content = typeof body.content === 'string' ? body.content.slice(0, 100_000) : existing.content;
  const status = body.status === BlogPostStatus.PUBLISHED
    ? BlogPostStatus.PUBLISHED
    : body.status === BlogPostStatus.DRAFT
      ? BlogPostStatus.DRAFT
      : existing.status;

  if (!title) return NextResponse.json({ error: 'TITLE_REQUIRED' }, { status: 400 });
  if (status === BlogPostStatus.PUBLISHED && !content.trim()) {
    return NextResponse.json({ error: 'CONTENT_REQUIRED_TO_PUBLISH' }, { status: 400 });
  }

  const requestedSlug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const slug = requestedSlug && requestedSlug !== existing.slug
    ? await uniqueBlogSlug(requestedSlug, existing.id)
    : existing.slug;
  const publishedAt = status === BlogPostStatus.PUBLISHED
    ? existing.publishedAt ?? new Date()
    : null;

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      title,
      slug,
      excerpt: Object.prototype.hasOwnProperty.call(body, 'excerpt')
        ? trimOptional(body.excerpt, 400)
        : existing.excerpt,
      content,
      seoTitle: Object.prototype.hasOwnProperty.call(body, 'seoTitle')
        ? trimOptional(body.seoTitle, 180)
        : existing.seoTitle,
      seoDescription: Object.prototype.hasOwnProperty.call(body, 'seoDescription')
        ? trimOptional(body.seoDescription, 320)
        : existing.seoDescription,
      status,
      publishedAt,
    },
    include: postInclude,
  });

  await logAdminAudit({
    adminId: admin.id,
    action: 'BLOG_POST_UPDATE',
    entityType: 'BlogPost',
    entityId: post.id,
    payload: { slug: post.slug, status: post.status },
  });

  revalidatePath('/blog');
  revalidatePath(`/blog/${existing.slug}`);
  revalidatePath(`/blog/${post.slug}`);
  return NextResponse.json({ ok: true, post });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(AdminRole.SUPERADMIN).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { id } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: { assets: { select: { key: true } } },
  });
  if (!post) return NextResponse.json({ error: 'POST_NOT_FOUND' }, { status: 404 });

  await prisma.blogPost.delete({ where: { id } });
  await Promise.allSettled(post.assets.map((asset) => deleteKey(asset.key)));

  await logAdminAudit({
    adminId: admin.id,
    action: 'BLOG_POST_DELETE',
    entityType: 'BlogPost',
    entityId: post.id,
    payload: { slug: post.slug },
  });

  revalidatePath('/blog');
  revalidatePath(`/blog/${post.slug}`);
  return NextResponse.json({ ok: true });
}
