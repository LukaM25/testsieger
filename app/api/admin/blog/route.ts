import { AdminRole, BlogAssetKind, BlogPostStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

import { logAdminAudit, requireAdmin } from '@/lib/admin';
import { trimOptional, uniqueBlogSlug } from '@/lib/blog';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const postInclude = {
  author: { select: { id: true, name: true, email: true } },
  assets: { orderBy: { createdAt: 'asc' as const } },
};

export async function GET() {
  const admin = await requireAdmin(AdminRole.SUPERADMIN).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const posts = await prisma.blogPost.findMany({
    include: postInclude,
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const admin = await requireAdmin(AdminRole.SUPERADMIN).catch(() => null);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 180) : '';
  const content = typeof body.content === 'string' ? body.content.slice(0, 100_000) : '';
  if (!title) return NextResponse.json({ error: 'TITLE_REQUIRED' }, { status: 400 });

  const slug = await uniqueBlogSlug(typeof body.slug === 'string' && body.slug.trim() ? body.slug : title);
  const requestedStatus = body.status === BlogPostStatus.PUBLISHED
    ? BlogPostStatus.PUBLISHED
    : BlogPostStatus.DRAFT;
  if (requestedStatus === BlogPostStatus.PUBLISHED && !content.trim()) {
    return NextResponse.json({ error: 'CONTENT_REQUIRED_TO_PUBLISH' }, { status: 400 });
  }

  const post = await prisma.blogPost.create({
    data: {
      title,
      slug,
      excerpt: trimOptional(body.excerpt, 400),
      content,
      seoTitle: trimOptional(body.seoTitle, 180),
      seoDescription: trimOptional(body.seoDescription, 320),
      status: requestedStatus,
      publishedAt: requestedStatus === BlogPostStatus.PUBLISHED ? new Date() : null,
      authorId: admin.id,
    },
    include: postInclude,
  });

  await logAdminAudit({
    adminId: admin.id,
    action: 'BLOG_POST_CREATE',
    entityType: 'BlogPost',
    entityId: post.id,
    payload: { slug: post.slug, status: post.status },
  });

  return NextResponse.json({ ok: true, post }, { status: 201 });
}
