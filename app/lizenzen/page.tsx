import Link from 'next/link';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { normalizeLocale } from '@/lib/i18n';
import LizenzenClient from './LizenzenClient';

export const metadata = {
  title: 'Lizenzverwaltung & Testergebnisse – Prüfsiegel Zentrum UG',
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

const faq = [
  {
    question: 'Wie kann ich die Gültigkeit eines Siegels prüfen?',
    answer:
      'Nutzen Sie das Formular zur Lizenzsuche. Geben Sie entweder den Lizenzcode oder den Produktnamen ein. Die Antwort zeigt Status, Laufzeit und zuständige Ansprechpartner.',
  },
  {
    question: 'Welche Dateiformate stehen zur Verfügung?',
    answer:
      'Sie erhalten das Siegel in PNG, SVG und PDF. Farbliche Varianten (hell/dunkel) liegen bei. Weitere Formate liefern wir auf Anfrage.',
  },
  {
    question: 'Was passiert bei Produktänderungen?',
    answer:
      'Melden Sie wesentliche Änderungen (Material, Lieferkette, Softwareversion) innerhalb von 30 Tagen im Kundenportal. Wir prüfen, ob ein Re-Audit notwendig ist.',
  },
];

// Force dynamic so new certificates appear instantly
export const dynamic = 'force-dynamic';

const results = [
  {
    product: { de: 'Ausbildung-Check', en: 'Training Check' },
    category: { de: 'Digitales Lernangebot', en: 'Digital learning offer' },
    score: '92 / 100',
    status: { de: 'Zugelassen', en: 'Approved' },
    summary: {
      de: 'Hohe Zufriedenheit der Testpersonen, revisionssichere Lernstandsdokumentation sowie DSGVO-konforme Plattform.',
      en: 'High tester satisfaction, audit-proof learning records, and GDPR-compliant platform.',
    },
  },
  {
    product: { de: 'SmartHome Komfortpaket', en: 'SmartHome Comfort Package' },
    category: { de: 'Haustechnik', en: 'Home technology' },
    score: '85 / 100',
    status: { de: 'Mit Auflagen', en: 'With conditions' },
    summary: {
      de: 'Sehr gute Energieeffizienz. Empfehlung: Nachbesserung der Dokumentation für Firmware-Updates.',
      en: 'Very good energy efficiency. Recommendation: improve documentation for firmware updates.',
    },
  },
  {
    product: { de: 'Organic Care Set', en: 'Organic Care Set' },
    category: { de: 'Körperpflege', en: 'Personal care' },
    score: '78 / 100',
    status: { de: 'In Prüfung', en: 'Under review' },
    summary: {
      de: 'Sensorische Tests abgeschlossen, Laboranalysen zu Haltbarkeit laufen. Finales Ergebnis ab Q3 erwartet.',
      en: 'Sensory tests completed, shelf-life lab analyses in progress. Final result expected from Q3.',
    },
  },
];

const badges = [
  {
    title: { de: 'Siegel "Gold"', en: 'Seal "Gold"' },
    description:
      { de: 'Gesamtwert ≥ 90 Punkte, keinerlei kritische Abweichungen. Nutzungsdauer 24 Monate, jährliches Monitoring obligatorisch.', en: 'Total score ≥ 90 points, no critical deviations. Usage 24 months, annual monitoring required.' },
  },
  {
    title: { de: 'Siegel "Silber"', en: 'Seal "Silver"' },
    description:
      { de: 'Gesamtwert ≥ 80 Punkte, ggf. Nebenauflagen. Nutzungsdauer 12 Monate, optionale Re-Audits bei Produktupdates.', en: 'Total score ≥ 80 points, possible minor conditions. Usage 12 months, optional re-audits on product updates.' },
  },
  {
    title: { de: 'In Bewertung', en: 'Under evaluation' },
    description:
      { de: 'Der Prüfprozess ist aktiv. Zwischenberichte stehen im Kundenportal zur Verfügung, das Siegel ist noch nicht freigegeben.', en: 'The evaluation is in progress. Interim reports are available in the customer portal; the seal is not yet released.' },
  },
];

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

type Props = {
  searchParams: {
    productId?: string;
  };
};

export default async function LizenzenPage({ searchParams }: Props) {
  const locale = normalizeLocale((await cookies()).get('lang')?.value || 'de');
  const tr = (de: string, en: string) => (locale === 'en' ? en : de);
  const productId = searchParams?.productId;

  // 1. Fetch Valid Data from DB
  const products = await prisma.product.findMany({
    where: {
      status: { in: ['COMPLETED', 'IN_REVIEW', 'PAID'] }, 
      certificate: { isNot: null }
    },
    include: {
      certificate: true,
      user: { select: { company: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const certificate = productId
    ? await prisma.certificate.findFirst({
        where: { productId },
        include: { product: { include: { user: true } } },
      })
    : null;

  return (
    <div className="bg-white text-brand-text">
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

      <section className="-mt-10 pb-16 lg:pb-20">
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

      <section className="pb-16 lg:pb-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 lg:grid-cols-[1.05fr,0.95fr]">
            <div className="rounded-3xl border border-gray-100 bg-[#F0F6FA] p-7 shadow-lg animate-fade-in-up" data-animate="section">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-primary">{tr('Workflow', 'Workflow')}</p>
                  <h2 className="text-xl font-semibold text-brand-dark">{tr('So steuern Sie Lizenzen', 'How you manage licenses')}</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    {tr('Von der Ausgabe bis zur Archivierung: klar strukturierte Schritte mit Monitoring.', 'From issuance to archiving: clear steps with monitoring.')}
                  </p>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {licenseSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary/10 text-sm font-bold text-brand-primary">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-brand-dark">{step.title}</h3>
                      <p className="mt-1 text-sm text-gray-600 leading-relaxed">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-gray-100 bg-white p-7 shadow-lg animate-fade-in-up" data-animate="section">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-primary">{tr('Assets & Berichte', 'Assets & reports')}</p>
              <h3 className="mt-2 text-xl font-semibold text-brand-dark">{tr('Siegel, PDFs und Audit-Trail', 'Seals, PDFs, and audit trail')}</h3>
              <p className="mt-2 text-sm text-gray-600">
                {tr('Alle Zertifikate, Siegelgrafiken und Ansprechpartner liegen gebündelt – inkl. Historie und Einsatzorten.', 'All certificates, seal artwork, and contacts in one place – including history and usage locations.')}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-[#F0F6FA] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">{tr('Siegel-Assets', 'Seal assets')}</p>
                  <p className="mt-2 text-sm text-gray-700">{tr('PNG, SVG und PDF-Reports direkt aus dem Portal herunterladen.', 'Download PNG, SVG, and PDF reports directly from the portal.')}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-[#F0F6FA] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">{tr('Audit-Trail', 'Audit trail')}</p>
                  <p className="mt-2 text-sm text-gray-700">{tr('Änderungen an Status, Laufzeiten und Einsatzorten werden protokolliert.', 'Changes to status, runtimes, and usage locations are logged.')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {productId ? (
        <section className="mx-auto max-w-6xl px-6 pb-10 pt-4">
          {certificate ? (
            <div className="rounded-3xl border border-gray-100 bg-white p-9 shadow-lg">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-primary">
                    {tr('Verifikation für Produkt-ID', 'Verification for product ID')} {productId}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-brand-dark">
                    {tr('Siegelnummer', 'Seal number')}: <span className="font-mono text-base text-gray-600">{certificate.seal_number}</span>
                  </h3>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-4 py-2 text-xs font-semibold text-brand-primary">
                  <span className="h-2 w-2 rounded-full bg-brand-primary" />
                  {tr('Gültig & geprüft', 'Valid & verified')}
                </span>
              </div>
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                <div className="space-y-2 rounded-2xl border border-gray-100 bg-[#F0F6FA] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-primary">{tr('Produkt', 'Product')}</p>
                  <p className="text-lg font-semibold text-brand-dark">{certificate.product.name}</p>
                  <p className="text-sm text-gray-600">{certificate.product.brand}</p>
                </div>
                <div className="space-y-2 rounded-2xl border border-gray-100 bg-[#F0F6FA] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-primary">{tr('Kunde', 'Customer')}</p>
                  <p className="text-sm text-gray-700">{certificate.product.user?.name}</p>
                  {certificate.product.user?.company && (
                    <p className="text-sm text-gray-700">{certificate.product.user.company}</p>
                  )}
                  <p className="text-xs text-gray-500">{certificate.product.user?.email}</p>
                </div>
                <div className="space-y-2 rounded-2xl border border-gray-100 bg-[#F0F6FA] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-primary">{tr('Aktionen', 'Actions')}</p>
                  <Link
                    href={certificate.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-dark"
                  >
                    {tr('Prüfbericht herunterladen', 'Download report')}
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </Link>
                  <Link
                    href={`/verify/${certificate.seal_number}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-brand-primary/30 px-4 py-2 text-xs font-semibold text-brand-dark transition hover:-translate-y-0.5 hover:border-brand-primary hover:text-brand-primary"
                  >
                    {tr('Detail-Verifikation', 'Detailed verification')}
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-orange-200 bg-orange-50 p-6 text-sm text-orange-900 shadow-sm">
              <p>
                {tr('Keine gültige Prüfung für Produkt-ID', 'No valid test for product ID')} {productId}{' '}
                {tr('gefunden. Bitte überprüfen Sie die Siegelnummer oder wenden Sie sich an unseren Support.', 'found. Please check the seal number or contact our support.')}
              </p>
            </div>
          )}
        </section>
      ) : null}

      <section className="border-t border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-16 lg:pt-20">
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-3xl space-y-2">
              <h2 className="text-3xl font-bold text-brand-dark md:text-4xl">{tr('Aktuelle Testergebnisse', 'Current test results')}</h2>
              <p className="text-lg text-gray-600">
                {tr(
                  'Diese Übersicht dient als Placeholder für echte Prüfberichte. Struktur, Bewertungsskala und Call-to-Actions sind bereits so angelegt, dass finale Inhalte ohne Designänderungen übernommen werden können.',
                  'This overview serves as a placeholder for real test reports. Structure, scoring, and CTAs are set so final content can be inserted without design changes.'
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/kontakt"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-primary/15 transition hover:-translate-y-0.5 hover:bg-brand-dark"
              >
                {tr('Prüfbericht anfordern', 'Request test report')}
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-brand-dark shadow-sm transition hover:-translate-y-0.5 hover:border-brand-primary hover:text-brand-primary"
              >
                {tr('Kundenportal öffnen', 'Open customer portal')}
              </Link>
            </div>
          </div>

          <div className="mt-10 overflow-hidden rounded-3xl border border-gray-100 bg-[#F0F6FA] shadow-inner">
            <div className="grid grid-cols-1 divide-y divide-gray-100 md:divide-y-0 md:divide-x md:grid-cols-3">
              {results.map((entry) => (
                <div key={entry.product.de} className="p-7">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-brand-primary">{tr(entry.category.de, entry.category.en)}</p>
                      <h3 className="mt-2 text-lg font-semibold text-brand-dark">{tr(entry.product.de, entry.product.en)}</h3>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-brand-primary/10 px-3 py-1 text-[11px] font-semibold text-brand-primary">
                      {tr(entry.status.de, entry.status.en)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{tr(entry.summary.de, entry.summary.en)}</p>
                  <div className="mt-4 text-sm font-semibold text-brand-dark">
                    {tr('Bewertung', 'Score')}: <span className="text-lg">{entry.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F0F6FA]">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <h3 className="text-2xl font-semibold text-brand-dark">{tr('Siegelstufen', 'Seal levels')}</h3>
              <p className="max-w-3xl text-sm text-gray-600">
                {tr(
                  'Die finale Ausprägung des Prüfsiegels orientiert sich an der erreichten Punktzahl. Diese Platzhalterbeschreibungen lassen sich durch echte Vergabekriterien ersetzen.',
                  'The final seal tier depends on the achieved score. These placeholder descriptions can be replaced with the real award criteria.'
                )}
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
              {badges.map((badge) => (
                <div
                  key={badge.title.de}
                  className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-md"
                >
                <div className="absolute right-4 top-4 h-10 w-10 rounded-full bg-brand-primary/10" />
                  <div className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-primary">{tr('Stufe', 'Level')}</div>
                  <h4 className="mt-2 text-xl font-semibold text-brand-dark">{tr(badge.title.de, badge.title.en)}</h4>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">{tr(badge.description.de, badge.description.en)}</p>
                </div>
              ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-12 lg:pt-14">
          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-lg">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-brand-dark">{tr('Fragen & Antworten', 'Questions & answers')}</h2>
                <p className="text-sm text-gray-600">{tr('Kurz erklärt, wie der Lizenzcheck funktioniert.', 'Short answers on how license checks work.')}</p>
              </div>
            </div>
            <div className="mt-8 grid gap-7 md:grid-cols-2">
              {faq.map((item) => (
                <div key={item.question} className="rounded-2xl border border-gray-100 bg-[#F0F6FA] p-7">
                  <h3 className="text-lg font-semibold text-brand-dark">{item.question}</h3>
                  <p className="mt-2 text-sm text-gray-600">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
