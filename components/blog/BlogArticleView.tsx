import Link from 'next/link';

import BlogContent from './BlogContent';

type ArticleAsset = {
  id: string;
  kind: 'COVER' | 'ATTACHMENT';
  fileName: string;
  sizeBytes: number;
};

type Article = {
  title: string;
  excerpt: string | null;
  content: string;
  publishedAt: Date | string | null;
  updatedAt: Date | string;
  author: { name: string };
  assets: ArticleAsset[];
};

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

export default function BlogArticleView({ article, preview = false }: { article: Article; preview?: boolean }) {
  const cover = article.assets.find((asset) => asset.kind === 'COVER');
  const attachments = article.assets.filter((asset) => asset.kind === 'ATTACHMENT');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {preview && (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-center text-sm font-semibold text-amber-900">
          Entwurfsvorschau – dieser Beitrag ist nicht öffentlich sichtbar.
        </div>
      )}
      <article>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-4xl px-6 pb-12 pt-14 sm:pb-16 sm:pt-20">
            <Link href={preview ? '/admin/blog' : '/blog'} className="text-sm font-semibold text-brand-green hover:underline">
              ← {preview ? 'Zurück zur Verwaltung' : 'Alle Blog Beiträge'}
            </Link>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              {article.publishedAt ? formatDate(article.publishedAt) : 'Noch nicht veröffentlicht'} · {article.author.name}
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{article.title}</h1>
            {article.excerpt && <p className="mt-6 text-xl leading-8 text-slate-600">{article.excerpt}</p>}
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
          {cover && (
            <img
              src={`/api/blog/assets/${cover.id}`}
              alt={`Titelbild zu ${article.title}`}
              className="mb-12 aspect-[16/9] w-full rounded-3xl border border-slate-200 object-cover shadow-lg"
            />
          )}

          <BlogContent content={article.content} />

          {attachments.length > 0 && (
            <section className="mt-14 border-t border-slate-200 pt-10">
              <h2 className="text-2xl font-bold">Dokumente und Downloads</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {attachments.map((asset) => (
                  <a
                    key={asset.id}
                    href={`/api/blog/assets/${asset.id}`}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  >
                    <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-rose-600">PDF</span>
                    <span className="mt-2 block break-words font-semibold text-slate-900">{asset.fileName}</span>
                    <span className="mt-1 block text-sm text-slate-500">{formatBytes(asset.sizeBytes)} · Herunterladen</span>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </div>
  );
}
