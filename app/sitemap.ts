import type { MetadataRoute } from 'next';
import { BlogPostStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const STATIC: { path: string; priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }[] = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/produkte/produkt-test', priority: 0.95, changeFrequency: 'weekly' },
  { path: '/precheck', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/pakete', priority: 0.85, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.85, changeFrequency: 'monthly' },
  { path: '/kontakt', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/pruefverfahren', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/verfahren', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/produkte', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/produkte/spielplatz-sicherheit', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/produkte/ausbildung-check', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/arbeitssicherheit', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/ueber-uns', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/lizenzen', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/karriere', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/impressum', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/datenschutz', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/agb', priority: 0.2, changeFrequency: 'yearly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC.map((p) => ({
    url: `${SITE_URL}${p.path === '/' ? '' : p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: BlogPostStatus.PUBLISHED },
      select: { slug: true, updatedAt: true },
    });
    for (const post of posts) {
      entries.push({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  } catch (error) {
    console.error('SITEMAP_BLOG_ERROR', error);
  }
  return entries;
}
