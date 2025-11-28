import Link from 'next/link';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { normalizeLocale } from '@/lib/i18n';
import LizenzenClient from './LizenzenClient';

export const metadata = {
  title: 'Lizenzverwaltung & Testergebnisse – Prüfsiegel Zentrum UG',
  description:
    'Lizenzsuche, Verlängerung und aktuelle Testergebnisse in einem zentralen Bereich.',
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
    title: '3. Monitoring & Verlängerung',
    detail:
      'Wir erinnern 90 Tage vor Ablauf an notwendige Re-Checks. Verlängerungen lassen sich digital beauftragen.',
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
    <div className="bg-gray-50">
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 pb-16 pt-24 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">{tr('Lizenzverwaltung', 'License management')}</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900 md:text-5xl">{tr('Lizenzsuche & Verlängerung', 'License search & renewal')}</h1>
          <p className="mt-4 text-lg text-slate-600">
            {tr(
              'Dieser Bereich dient als Platzhalter für die spätere Live-Anbindung. Eine einfache Formularstruktur und strukturierte Abschnitte halten bereits alle relevanten Informationen bereit.',
              'This area is a placeholder for the later live integration. A simple form structure and sections already contain all relevant information.'
            )}
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-black"
            >
              {tr('Zum Kundenportal', 'Open customer portal')}
            </Link>
            <Link
              href="/kontakt"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
            >
              {tr('Lizenzberatung anfragen', 'Request license consulting')}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[3fr,2fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <LizenzenClient products={products} />
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">{tr('So läuft die Lizenzierung ab', 'How licensing works')}</h2>
            <div className="mt-6 space-y-4">
              {licenseSteps.map((step) => (
                <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-2xl font-semibold text-slate-900">{tr('Fragen & Antworten', 'Questions & answers')}</h2>
        <div className="mt-8 space-y-6">
          {faq.map((item) => (
            <div key={item.question} className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-slate-900">{item.question}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testergebnisse content (hidden for now) */}
      <section className="border-t border-slate-200 bg-white hidden">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">{tr('Transparenz', 'Transparency')}</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">{tr('Aktuelle Testergebnisse', 'Current test results')}</h2>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            {tr(
              'Diese Übersicht dient als Placeholder für echte Prüfberichte. Struktur, Bewertungsskala und Call-to-Actions sind bereits so angelegt, dass finale Inhalte ohne Designänderungen übernommen werden können.',
              'This overview serves as a placeholder for real test reports. Structure, scoring, and CTAs are set so final content can be inserted without design changes.'
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/kontakt"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-black"
            >
              {tr('Prüfbericht anfordern', 'Request test report')}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
            >
              {tr('Kundenportal öffnen', 'Open customer portal')}
            </Link>
          </div>
        </div>
      </section>

      {productId ? (
        <section className="mx-auto max-w-6xl px-6 py-10 hidden">
          {certificate ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">
                {tr('Verifikation für Produkt-ID', 'Verification for product ID')} {productId}
              </h3>
              <p className="text-sm text-slate-600">
                {tr('Siegelnummer', 'Seal number')}: <span className="font-mono">{certificate.seal_number}</span>
              </p>
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                <div className="space-y-2 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{tr('Produkt', 'Product')}</p>
                  <p className="text-lg font-semibold text-slate-900">{certificate.product.name}</p>
                  <p className="text-sm text-slate-600">{certificate.product.brand}</p>
                </div>
                <div className="space-y-2 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{tr('Kunde', 'Customer')}</p>
                  <p className="text-sm text-slate-700">{certificate.product.user?.name}</p>
                  {certificate.product.user?.company && (
                    <p className="text-sm text-slate-700">{certificate.product.user.company}</p>
                  )}
                  <p className="text-xs text-slate-500">{certificate.product.user?.email}</p>
                </div>
                <div className="space-y-2 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{tr('Aktionen', 'Actions')}</p>
                  <Link
                    href={certificate.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white"
                  >
                    {tr('Prüfbericht herunterladen', 'Download report')}
                  </Link>
                  <Link
                    href={`/verify/${certificate.seal_number}`}
                    className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                  >
                    {tr('Detail-Verifikation', 'Detailed verification')}
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-orange-200 bg-orange-50 p-6 text-sm text-orange-900">
              <p>
                {tr('Keine gültige Prüfung für Produkt-ID', 'No valid test for product ID')} {productId}{' '}
                {tr('gefunden. Bitte überprüfen Sie die Siegelnummer oder wenden Sie sich an unseren Support.', 'found. Please check the seal number or contact our support.')}
              </p>
            </div>
          )}
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-6 py-12 hidden">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 divide-y divide-slate-200">
            {results.map((entry) => (
              <div key={entry.product.de} className="grid gap-6 px-6 py-6 md:grid-cols-[2fr,1fr,1fr] md:items-center">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{tr(entry.product.de, entry.product.en)}</h3>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{tr(entry.category.de, entry.category.en)}</p>
                  <p className="mt-3 text-sm text-slate-600">{tr(entry.summary.de, entry.summary.en)}</p>
                </div>
                <div className="flex flex-col gap-1 text-sm text-slate-700">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tr('Bewertung', 'Score')}</span>
                  <span className="text-2xl font-semibold text-slate-900">{entry.score}</span>
                </div>
                <div className="flex flex-col gap-1 text-sm text-slate-700">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tr('Status', 'Status')}</span>
                  <span className="inline-flex w-fit items-center rounded-full bg-slate-900/10 px-3 py-1 text-xs font-medium text-slate-900">
                    {tr(entry.status.de, entry.status.en)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white hidden">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h3 className="text-2xl font-semibold text-slate-900">{tr('Siegelstufen', 'Seal levels')}</h3>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            {tr(
              'Die finale Ausprägung des Prüfsiegels orientiert sich an der erreichten Punktzahl. Diese Platzhalterbeschreibungen lassen sich durch echte Vergabekriterien ersetzen.',
              'The final seal tier depends on the achieved score. These placeholder descriptions can be replaced with the real award criteria.'
            )}
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {badges.map((badge) => (
              <div key={badge.title.de} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{tr('Stufe', 'Level')}</div>
                <h4 className="mt-2 text-xl font-semibold text-slate-900">{tr(badge.title.de, badge.title.en)}</h4>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{tr(badge.description.de, badge.description.en)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
