import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Testergebnisse – Prüfsiegel Zentrum UG',
  description:
    'Platzhalterübersicht mit Beispiel-Ergebnissen aus vergangenen Prüfungen inklusive Bewertungsskala und Download-Hinweisen.',
};

const results = [
  {
    product: 'Ausbildung-Check',
    category: 'Digitales Lernangebot',
    score: '92 / 100',
    status: 'Zugelassen',
    summary:
      'Hohe Zufriedenheit der Testpersonen, revisionssichere Lernstandsdokumentation sowie DSGVO-konforme Plattform.',
  },
  {
    product: 'SmartHome Komfortpaket',
    category: 'Haustechnik',
    score: '85 / 100',
    status: 'Mit Auflagen',
    summary:
      'Sehr gute Energieeffizienz. Empfehlung: Nachbesserung der Dokumentation für Firmware-Updates.',
  },
  {
    product: 'Organic Care Set',
    category: 'Körperpflege',
    score: '78 / 100',
    status: 'In Prüfung',
    summary:
      'Sensorische Tests abgeschlossen, Laboranalysen zu Haltbarkeit laufen. Finales Ergebnis ab Q3 erwartet.',
  },
];

const badges = [
  {
    title: 'Siegel "Gold"',
    description:
      'Gesamtwert ≥ 90 Punkte, keinerlei kritische Abweichungen. Nutzungsdauer 24 Monate, jährliches Monitoring obligatorisch.',
  },
  {
    title: 'Siegel "Silber"',
    description:
      'Gesamtwert ≥ 80 Punkte, ggf. Nebenauflagen. Nutzungsdauer 12 Monate, optionale Re-Audits bei Produktupdates.',
  },
  {
    title: 'In Bewertung',
    description:
      'Der Prüfprozess ist aktiv. Zwischenberichte stehen im Kundenportal zur Verfügung, das Siegel ist noch nicht freigegeben.',
  },
];

type Props = {
  searchParams: {
    productId?: string;
  };
};

export default async function TestergebnissePage({ searchParams }: Props) {
  const productId = searchParams.productId;
  const certificate = productId
    ? await prisma.certificate.findFirst({
        where: { productId },
        include: {
          product: {
            include: {
              user: true,
            },
          },
        },
      })
    : null;

  return (
    <div className="bg-gray-50">
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-24">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Transparenz</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900 md:text-5xl">Aktuelle Testergebnisse</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            Diese Übersicht dient als Placeholder für echte Prüfberichte. Struktur, Bewertungsskala und Call-to-Actions sind bereits so angelegt, dass finale Inhalte ohne Designänderungen übernommen werden können.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/kontakt"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-black"
            >
              Prüfbericht anfordern
            </Link>
            <Link
              href="/kundenportal"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
            >
              Kundenportal öffnen
            </Link>
          </div>
        </div>
      </section>

      {productId ? (
        <section className="mx-auto max-w-6xl px-6 py-10">
          {certificate ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Verifikation für Produkt-ID {productId}</h2>
              <p className="text-sm text-slate-600">Siegelnummer: <span className="font-mono">{certificate.seal_number}</span></p>
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                <div className="space-y-2 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Produkt</p>
                  <p className="text-lg font-semibold text-slate-900">{certificate.product.name}</p>
                  <p className="text-sm text-slate-600">{certificate.product.brand}</p>
                </div>
                <div className="space-y-2 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Kunde</p>
                  <p className="text-sm text-slate-700">{certificate.product.user?.name}</p>
                  {certificate.product.user?.company && (
                    <p className="text-sm text-slate-700">{certificate.product.user.company}</p>
                  )}
                  <p className="text-xs text-slate-500">{certificate.product.user?.email}</p>
                </div>
                <div className="space-y-2 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Aktionen</p>
                  <Link href={certificate.pdfUrl} className="inline-flex rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white">
                    Prüfbericht herunterladen
                  </Link>
                  <Link href={`/verify/${certificate.seal_number}`} className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">
                    Detail-Verifikation
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-orange-200 bg-orange-50 p-6 text-sm text-orange-900">
              <p>Keine gültige Prüfung für Produkt-ID {productId} gefunden. Bitte überprüfen Sie die Siegelnummer oder wenden Sie sich an unseren Support.</p>
            </div>
          )}
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 divide-y divide-slate-200">
            {results.map((entry) => (
              <div key={entry.product} className="grid gap-6 px-6 py-6 md:grid-cols-[2fr,1fr,1fr] md:items-center">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{entry.product}</h2>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{entry.category}</p>
                  <p className="mt-3 text-sm text-slate-600">{entry.summary}</p>
                </div>
                <div className="flex flex-col gap-1 text-sm text-slate-700">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bewertung</span>
                  <span className="text-2xl font-semibold text-slate-900">{entry.score}</span>
                </div>
                <div className="flex flex-col gap-1 text-sm text-slate-700">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                  <span className="inline-flex w-fit items-center rounded-full bg-slate-900/10 px-3 py-1 text-xs font-medium text-slate-900">
                    {entry.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-semibold text-slate-900">Siegelstufen</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Die finale Ausprägung des Prüfsiegels orientiert sich an der erreichten Punktzahl. Diese Platzhalterbeschreibungen lassen sich durch echte Vergabekriterien ersetzen.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {badges.map((badge) => (
              <div key={badge.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Stufe</div>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">{badge.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
