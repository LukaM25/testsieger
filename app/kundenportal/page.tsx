import Link from 'next/link';

export const metadata = {
  title: 'Kundenportal – Prüfsiegel Zentrum UG',
  description:
    'Placeholder-Seite für das Kundenportal mit Feature-Übersicht, Onboarding-Schritten und Demo-Zugang.',
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

export default function KundenportalPage() {
  return (
    <div className="bg-gray-50">
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 pb-16 pt-24 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Portal</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900 md:text-5xl">Digitales Kundenportal</h1>
          <p className="mt-4 text-lg text-slate-600">
            Diese Seite simuliert den späteren Portalzugang. Layout und Inhalte orientieren sich bereits an der finalen Informationsarchitektur.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-black"
            >
              Zum Login
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
