import Link from 'next/link';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { normalizeLocale } from '@/lib/i18n';
import LizenzenClient from './LizenzenClient';
import { ensureSignedS3Url, signedS3Url } from '@/lib/s3';

async function signCertificateAssetUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('/')) return url;
  if (/^https?:\/\//i.test(url)) return ensureSignedS3Url(url);

  try {
    if (url.startsWith('s3://')) {
      const parsed = new URL(url);
      return signedS3Url(parsed.pathname.replace(/^\//, ''));
    }

    return signedS3Url(url);
  } catch {
    return url;
  }
}

export const metadata = {
  description:
    'Lizenzsuche, Lizenzverwaltung und aktuelle Testergebnisse in einem zentralen Bereich.',
};

const licenseSteps = [
  {
    title: '1. Lizenzcode erhalten',
    detail:
      'Nach positiver Bewertung senden wir einen eindeutigen Lizenzcode. Dieser Code verknüpft Produkt, Laufzeit und gültige Einsatzbereiche.',
  },
  {
    title: '2. Veröffentlichung melden',
    detail:
      'Sobald das Siegel live eingesetzt wird, kann die Veröffentlichung im Kundenportal mit wenigen Klicks bestätigt werden.',
  },
  {
    title: '3. Verwaltung & Monitoring',
    detail:
      'Wir überwachen Laufzeiten, erinnern 90 Tage vor Ablauf und pflegen Status-Updates direkt im Portal.',
  },
];

export const dynamic = 'force-dynamic';

const managementHighlights = [
  {
    title: { de: 'Statusverwaltung in Echtzeit', en: 'Real-time status control' },
    detail: {
      de: 'Aktualisieren Sie Siegelstatus, Einsatzorte und Ansprechpartner ohne E-Mail-Pingpong.',
      en: 'Update seal status, usage locations, and contacts without email back-and-forth.',
    },
  },
  {
    title: { de: 'Assets & Dokumente gebündelt', en: 'Assets & documents bundled' },
    detail: {
      de: 'PDF-Berichte, Siegelgrafiken und Lizenzcodes liegen zentral, revisionssicher bereit.',
      en: 'PDF reports, seal graphics, and license codes live centrally and audit-proof.',
    },
  },
  {
    title: { de: 'Reminder & Monitoring', en: 'Reminders & monitoring' },
    detail: {
      de: 'Automatische Erinnerungen 90 Tage vor Ablauf, klare Aufgabenlisten für Re-Checks.',
      en: 'Automatic reminders 90 days before expiry with clear to-do lists for re-checks.',
    },
  },
];

export default async function LizenzenPage() {
  const locale = normalizeLocale((await cookies()).get('lang')?.value || 'de');
  const tr = (de: string, en: string) => (locale === 'en' ? en : de);

  const productsRaw = await prisma.product.findMany({
    where: {
      status: { in: ['COMPLETED', 'IN_REVIEW', 'PAID'] },
      certificate: { isNot: null },
    },
    include: {
      certificate: true,
      license: {
        select: {
          id: true,
          licenseCode: true,
          status: true,
        },
      },
      user: { select: { company: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const products = await Promise.all(
    productsRaw.map(async (product) =>
      product.certificate
        ? {
            ...product,
            certificate: {
              ...product.certificate,
              pdfUrl: await signCertificateAssetUrl(product.certificate.pdfUrl),
              reportUrl: await signCertificateAssetUrl(product.certificate.reportUrl),
              sealUrl: await signCertificateAssetUrl(product.certificate.sealUrl),
            },
          }
        : product
    )
  );

  const dateFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const recentTestedProducts = products
    .filter((product) => product.certificate)
    .sort(
      (a, b) =>
        new Date(b.certificate?.createdAt ?? b.createdAt).getTime() -
        new Date(a.certificate?.createdAt ?? a.createdAt).getTime()
    )
    .slice(0, 3);

  return (
    <div className="bg-white text-brand-text">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F0F6FA] via-white to-white border-b border-gray-100">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -left-20 top-12 h-56 w-56 rounded-full bg-brand-primary/10 blur-3xl" />
          <div className="absolute right-0 -top-10 h-64 w-64 rounded-full bg-brand-dark/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20 animate-fade-in-up">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr,0.95fr]">
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold leading-tight text-brand-dark sm:text-5xl md:text-6xl">
                  {tr('Lizenzsuche & Lizenzverwaltung', 'License search & management')}
                </h1>
                <p className="text-lg text-gray-700 md:text-xl">
                  {tr(
                    'Verwalten Sie Siegel, Laufzeiten und Prüfberichte in einem zentralen Hub. Lizenzsuche, Monitoring und Assets sind sofort griffbereit.',
                    'Manage seals, runtimes, and reports in a single hub. License search, monitoring, and assets are ready at a glance.'
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5 hover:bg-brand-dark"
                >
                  {tr('Zum Kundenportal', 'Open customer portal')}
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/kontakt"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-brand-dark shadow-sm transition hover:-translate-y-0.5 hover:border-brand-primary hover:text-brand-primary"
                >
                  {tr('Lizenzberatung anfragen', 'Request license consulting')}
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:max-w-xl">
                {managementHighlights.map((item) => (
                  <div key={item.title.de} className="rounded-2xl border border-gray-100 bg-white/90 p-4 shadow-sm animate-fade-in" data-animate="card">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">{tr(item.title.de, item.title.en)}</p>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{tr(item.detail.de, item.detail.en)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-gray-100 bg-white p-7 shadow-xl shadow-brand-dark/5 animate-fade-in-up" data-animate="card">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-brand-dark">{tr('Alle Lizenzen, ein Arbeitsplatz', 'All licenses, one workspace')}</p>
                </div>
                <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary">{tr('Live', 'Live')}</span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-[#F0F6FA] p-4 animate-fade-in" data-animate="card">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">{tr('Schnellcheck', 'Quick check')}</p>
                  <p className="mt-2 text-sm text-gray-700">
                    {tr('QR-Code scannen, Lizenzcode oder Produkt-ID eingeben – sofortiger Status.', 'Scan QR, enter license code or product ID – instant status.')}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-[#F0F6FA] p-4 animate-fade-in" data-animate="card">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">{tr('Monitoring', 'Monitoring')}</p>
                  <p className="mt-2 text-sm text-gray-700">
                    {tr('Ablaufdaten, Re-Checks, Siegel-Assets und Ansprechpartner an einem Ort.', 'Expiry dates, re-checks, seal assets, and contacts in one place.')}
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {licenseSteps.map((step, index) => (
                  <div key={step.title} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm animate-fade-in" data-animate="card">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/10 text-xs font-bold text-brand-primary">
                      {index + 1}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-brand-dark">{step.title}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest tested products */}
      <section className="-mt-10 pb-10 lg:pb-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl border border-gray-100 bg-white p-7 shadow-xl shadow-brand-dark/5 animate-fade-in-up" data-animate="section">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-primary">{tr('Live-Übersicht', 'Live overview')}</p>
                <h2 className="mt-2 text-2xl font-semibold text-brand-dark">{tr('Zuletzt geprüfte Produkte', 'Recently tested products')}</h2>
                <p className="mt-2 text-sm text-gray-600">
                  {tr(
                    'Neue Prüfungen mit freigegebenem Prüfbericht und nutzbarem Siegel auf einen Blick.',
                    'New tests with released reports and usable seals at a glance.'
                  )}
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {tr('Live aktualisiert', 'Updated live')}
              </span>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {recentTestedProducts.map((product) => {
                const certificateCreatedAt = product.certificate?.createdAt ?? product.createdAt;
                const reportHref = product.certificate?.pdfUrl ? `/api/certificates/${product.id}/download` : null;
                const sealHref = product.certificate?.sealUrl || null;

                return (
                  <article key={product.id} className="flex min-h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-[#F0F6FA] shadow-sm">
                    <div className="flex items-start gap-4 p-4">
                      <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white bg-white">
                        {sealHref ? (
                          <img src={sealHref} alt="" className="h-full w-full object-contain p-2" />
                        ) : (
                          <span className="px-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                            {tr('Siegel folgt', 'Seal pending')}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-brand-primary">
                            {product.license?.status === 'ACTIVE' ? tr('Aktive Lizenz', 'Active license') : tr('Geprüft', 'Tested')}
                          </span>
                          <span className="text-xs text-gray-500">{dateFormatter.format(new Date(certificateCreatedAt))}</span>
                        </div>
                        <h3 className="mt-3 text-base font-semibold leading-snug text-brand-dark">{product.name}</h3>
                        <p className="mt-1 text-sm text-gray-600">{product.brand}</p>
                        {product.category && <p className="mt-2 text-xs font-medium text-gray-500">{product.category}</p>}
                      </div>
                    </div>
                    <div className="mt-auto border-t border-white/80 bg-white/80 p-4">
                      <div className="flex flex-wrap gap-2">
                        {reportHref ? (
                          <Link
                            href={reportHref}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-dark"
                          >
                            {tr('Prüfbericht', 'Report')}
                          </Link>
                        ) : (
                          <button type="button" disabled className="inline-flex cursor-not-allowed items-center justify-center rounded-lg bg-gray-200 px-3 py-2 text-xs font-semibold text-gray-500">
                            {tr('Prüfbericht folgt', 'Report pending')}
                          </button>
                        )}
                        {sealHref ? (
                          <Link
                            href={sealHref}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-lg border border-brand-primary/30 bg-white px-3 py-2 text-xs font-semibold text-brand-dark transition hover:-translate-y-0.5 hover:border-brand-primary hover:text-brand-primary"
                          >
                            {tr('Siegel öffnen', 'Open seal')}
                          </Link>
                        ) : (
                          <button type="button" disabled className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-400">
                            {tr('Siegel folgt', 'Seal pending')}
                          </button>
                        )}
                        {product.certificate?.seal_number && (
                          <Link
                            href={`/verify/${product.certificate.seal_number}`}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:-translate-y-0.5 hover:border-brand-primary hover:text-brand-primary"
                          >
                            {tr('Verifizieren', 'Verify')}
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
              </div>
            </div>
          </div>
        </section>

      {/* License search */}
      <section className="pb-16 lg:pb-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl border border-gray-100 bg-white p-7 shadow-xl shadow-brand-dark/5 animate-fade-in-up" data-animate="section">
            <div className="flex items-center justify-between pb-4">
              <div>
                <h2 className="text-xl font-semibold text-brand-dark">{tr('Lizenzcode prüfen & verwalten', 'Check & manage licenses')}</h2>
                <p className="text-sm text-gray-600">
                  {tr('Suche per Lizenzcode, Produktname oder ID. Relevante Details erscheinen sofort.', 'Search via license code, product name, or ID. Relevant details appear instantly.')}
                </p>
              </div>
            </div>
            <LizenzenClient products={products} />
          </div>
        </div>
      </section>

    </div>
  );
}
