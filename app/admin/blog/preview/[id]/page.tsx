import { AdminRole } from '@prisma/client';
import { notFound, redirect } from 'next/navigation';

import BlogArticleView from '@/components/blog/BlogArticleView';
import { getAdminContext, hasRequiredRole } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function BlogPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminContext();
  if (!admin) redirect('/admin');
  if (!hasRequiredRole(admin.role, AdminRole.SUPERADMIN)) redirect('/admin');

  const { id } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: {
      author: { select: { name: true } },
      assets: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!post) notFound();

  return <BlogArticleView article={post} preview={post.status !== 'PUBLISHED'} />;
}
