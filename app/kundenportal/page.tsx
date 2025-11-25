import { getSession } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ProductPayButton from './ProductPayButton';

export const metadata = {
  title: 'Kundenportal – Prüfsiegel Zentrum UG',
  description:
    'Portalübersicht mit Übersicht über Produkte, Zahlungsschritte und Fortschritt.',
};

const features = [
  {
    title: 'Dashboard & Timeline',
    text: 'Zeigt jede Prüfphase, Verantwortlichkeiten und Deadlines. Dokumente lassen sich direkt hochladen.',
  },
  {
    title: 'Lizenzverwaltung',
    text: 'Behalten Sie Laufzeiten im Blick und verlängern Sie Prüfsiegel mit wenigen Klicks.',
  },
  {
    title: 'Teamzugänge',
    text: 'Beliebig viele Nutzerrollen für Einkauf, Qualitätsmanagement und Kommunikation mit granularen Rechten.',
  },
];

const steps = [
  {
    step: '1',
    title: 'Einladung erhalten',
    detail: 'Nach dem Pre-Check schicken wir Ihnen automatisch einen Portalzugang mit temporärem Passwort.',
  },
  {
    step: '2',
    title: 'Unterlagen hochladen',
    detail: 'Dokumente können einzeln oder gebündelt per Drag & Drop hochgeladen und mit Kommentaren versehen werden.',
  },
  {
    step: '3',
    title: 'Status verfolgen',
    detail: 'Live-Status und Feedback-Schleifen reduzieren Rückfragen per Mail und halten alle Teams auf Kurs.',
  },
];

export default async function KundenportalPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      products: {
        include: { certificate: true },
        orderBy: { createdAt: 'desc' },
      },
      orders: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!user) redirect('/login');

  return (
    <div className="bg-gray-50">
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 pb-16 pt-24 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Portal</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900 md:text-5xl">Digitales Kundenportal</h1>
          <p className="mt-4 text-lg text-slate-600">
            Hier sehen Sie Ihre eingereichten Produkte. Die Testgebühr begleichen Sie hier; Lizenzpläne wählen und bezahlen Sie erst nach bestandenem Test.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-black"
            >
              Direkt ins Dashboard
            </Link>
            <Link
              href="/kontakt"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
            >
              Demo anfragen
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold text-slate-900">Ihre Produkte</h2>
            <p className="text-sm text-slate-500">
              Sobald der Pre-Check abgeschlossen ist, begleichen Sie hier die Testgebühr. Das System sendet Ihnen danach automatisch einen Prüfbericht per E-Mail; Lizenzgebühren folgen erst nach bestandenem Test.
            </p>
          </header>
          <div className="mt-6 space-y-6">
            {user.products.length === 0 ? (
              <p className="text-sm text-gray-600">Noch keine Produkte eingereicht.</p>
            ) : (
              user.products.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="text-lg font-semibold text-slate-900">{product.name}</div>
                    <p className="text-sm text-slate-600">
                      {product.brand} • Status: <span className="font-semibold text-slate-700">{statusLabel(product.status)}</span>
                    </p>
                    {product.certificate && (
                      <p className="mt-1 text-xs text-slate-500">Zertifikat wurde bereits erstellt.</p>
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-2 text-sm text-slate-500">
                    <ProductPayButton productId={product.id} status={product.status} />
                    <span>Eingereicht am {new Date(product.createdAt).toLocaleDateString('de-DE')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-semibold text-slate-900">Onboarding in drei Schritten</h2>
          <div className="mt-8 space-y-6">
            {steps.map((step) => (
              <div key={step.step} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 md:flex-row md:items-center">
                <div className="grid h-12 w-12 flex-none place-items-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {step.step}
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-900">{step.title}</div>
                  <p className="text-sm text-slate-600">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function statusLabel(status: string) {
  switch (status) {
    case 'PRECHECK':
      return 'Pre-Check eingereicht';
    case 'PAID':
      return 'Testgebühr bezahlt';
    case 'TEST_PASSED':
      return 'Test bestanden';
    case 'IN_REVIEW':
      return 'Prüfung läuft';
    case 'COMPLETED':
      return 'Zertifikat erstellt';
    default:
      return status;
  }
}
