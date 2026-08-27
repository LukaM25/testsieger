import { prisma } from './prisma';

export function normalizeBlogSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export async function uniqueBlogSlug(value: string, excludeId?: string) {
  const base = normalizeBlogSlug(value) || 'beitrag';
  let candidate = base;

  for (let suffix = 1; suffix < 1000; suffix += 1) {
    const existing = await prisma.blogPost.findFirst({
      where: {
        slug: candidate,
        id: excludeId ? { not: excludeId } : undefined,
      },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${base}-${suffix + 1}`;
  }

  throw new Error('BLOG_SLUG_UNAVAILABLE');
}

export function trimOptional(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}
