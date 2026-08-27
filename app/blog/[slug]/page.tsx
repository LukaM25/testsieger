import { BlogPostStatus } from '@prisma/client';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import BlogArticleView from '@/components/blog/BlogArticleView';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getPost(slug: string) {
  return prisma.blogPost.findFirst({
    where: { slug, status: BlogPostStatus.PUBLISHED },
    include: {
      author: { select: { name: true } },
      assets: { orderBy: { createdAt: 'asc' } },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.seoTitle || `${post.title} | Deutsches Prüfsiegel Institut`,
    description: post.seoDescription || post.excerpt || undefined,
    openGraph: {
      type: 'article',
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || undefined,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  return <BlogArticleView article={post} />;
}
