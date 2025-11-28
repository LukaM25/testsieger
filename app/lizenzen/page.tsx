import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import LizenzenClient from './LizenzenClient';

export const metadata = {
  title: 'Lizenzverwaltung – Prüfsiegel Zentrum UG',
  description:
    'Informationen zur Lizenzierung des Prüfsiegels mit Platzhaltern für Suchfunktion, Laufzeiten und Verlängerungen.',
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

export default async function LizenzenPage() {
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

  return (
    <div className="bg-gray-50">
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 pb-16 pt-24 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Lizenzverwaltung</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900 md:text-5xl">Lizenzsuche & Verlängerung</h1>
          <p className="mt-4 text-lg text-slate-600">
            Dieser Bereich dient als Platzhalter für die spätere Live-Anbindung. Eine einfache Formularstruktur und strukturierte Abschnitte halten bereits alle relevanten Informationen bereit.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-black"
            >
              Zum Kundenportal
            </Link>
            <Link
              href="/kontakt"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
            >
              Lizenzberatung anfragen
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12">
        {/* HERE WE INJECT THE FUNCTIONAL CLIENT */}
        <LizenzenClient products={products} />
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-semibold text-slate-900">So läuft die Lizenzierung ab</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {licenseSteps.map((step) => (
              <div key={step.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-semibold text-slate-900">Fragen & Antworten</h2>
        <div className="mt-8 space-y-6">
          {faq.map((item) => (
            <div key={item.question} className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-slate-900">{item.question}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
