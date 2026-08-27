import { BlogAssetKind, BlogPostStatus } from '@prisma/client';
import Link from 'next/link';

import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Blog Beiträge | Deutsches Prüfsiegel Institut',
  description: 'Aktuelle Beiträge des Deutschen Prüfsiegel Instituts zu Qualität, Produkttests und Prüfsiegeln.',
};

export const dynamic = 'force-dynamic';

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(value);
}

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: BlogPostStatus.PUBLISHED },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      publishedAt: true,
      createdAt: true,
      author: { select: { name: true } },
      assets: {
        where: { kind: BlogAssetKind.COVER },
        take: 1,
        select: { id: true },
      },
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-green">Aktuelles</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Blog Beiträge</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Neuigkeiten, Fachwissen und Einblicke rund um Produkttests, Qualität und vertrauenswürdige Prüfsiegel.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        {posts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-green">Demnächst</p>
            <h2 className="mt-3 text-2xl font-semibold">Die ersten Beiträge sind in Vorbereitung.</h2>
            <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">
              An dieser Stelle erscheinen künftig unsere aktuellen Blog Beiträge und die zugehörigen Dokumente.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const cover = post.assets[0];
              return (
                <article key={post.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <Link href={`/blog/${post.slug}`} className="flex h-full flex-col">
                    {cover ? (
                      <img
                        src={`/api/blog/assets/${cover.id}`}
                        alt=""
                        className="aspect-[16/9] w-full border-b border-slate-100 object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[16/9] items-center justify-center border-b border-slate-100 bg-slate-100 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                        DPI Aktuelles
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-green">
                        {formatDate(post.publishedAt ?? post.createdAt)}
                      </p>
                      <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight group-hover:text-brand-green">{post.title}</h2>
                      {post.excerpt && <p className="mt-4 line-clamp-3 leading-7 text-slate-600">{post.excerpt}</p>}
                      <p className="mt-6 text-sm font-semibold text-slate-900">Beitrag lesen →</p>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
