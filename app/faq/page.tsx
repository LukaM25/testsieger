import Link from 'next/link';

export const metadata = {
  title: 'FAQ | Deutsches Prüfsiegel Institut',
  description: 'Antworten auf häufig gestellte Fragen zu Prüfung, Prüfsiegeln, Lizenzierung und Ablauf.',
};

const questions = [
  {
    question: 'Was genau wird geprüft?',
    answer:
      'Wir prüfen Konsumprodukte anhand klar definierter und transparenter Prüfkriterien nach DPI-Standard. Abhängig von der Produktkategorie bewerten wir unter anderem Verarbeitung, Funktion, Sicherheit, Praxistauglichkeit und Dokumentation.',
  },
  {
    question: 'Wie lange dauert eine Prüfung?',
    answer:
      'Nach Eingang des Produkts dauert ein vollständiger Produkttest inklusive Prüfbericht und Zertifikat in der Regel 14 bis 21 Tage. Mit dem Prioritäts-Service kann sich die Bearbeitungszeit verkürzen.',
  },
  {
    question: 'Was passiert, wenn ein Produkt die Prüfung nicht besteht?',
    answer:
      'Sie erhalten eine klare Rückmeldung zu den nicht erfüllten Punkten. Anschließend können Sie das Produkt anpassen und erneut kostenlos zur Prüfung einreichen. Ein Prüfsiegel wird erst nach bestandener Prüfung vergeben.',
  },
  {
    question: 'Was erhalte ich nach bestandener Prüfung?',
    answer:
      'Sie erhalten das Testergebnis, einen detaillierten Prüfbericht, ein Zertifikat und das Prüfsiegel als PNG-Datei. Danach wählen Sie den passenden Lizenzplan für die vereinbarte Nutzung.',
  },
  {
    question: 'Warum gibt es eine jährliche Lizenz?',
    answer:
      'Die Jahreslizenz stellt sicher, dass Produkt und Prüfsiegel aktuell bleiben und das Siegel ausschließlich im vereinbarten Rahmen verwendet wird. Ohne aktive Lizenz endet das Nutzungsrecht.',
  },
  {
    question: 'Was passiert nach einer Kündigung?',
    answer:
      'Nach dem Ende des Gültigkeitszeitraums erlischt das Nutzungsrecht. Das Prüfsiegel muss dann aus Verpackungen, Webseiten und weiteren Marketingkanälen entfernt werden.',
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-green">Aktuelles</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Häufig gestellte Fragen</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Die wichtigsten Antworten rund um unsere Prüfungen, Prüfsiegel und Lizenzen.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="space-y-4">
          {questions.map((item) => (
            <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 [&::-webkit-details-marker]:hidden">
                <h2 className="text-lg font-semibold text-slate-900">{item.question}</h2>
                <span aria-hidden="true" className="text-xl text-slate-400 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="px-6 pb-6 leading-7 text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>

        <div className="mt-12 rounded-3xl bg-slate-900 px-6 py-8 text-center text-white sm:px-10">
          <h2 className="text-2xl font-semibold">Ihre Frage ist noch offen?</h2>
          <p className="mt-3 text-slate-300">Unser Team hilft Ihnen gerne persönlich weiter.</p>
          <Link
            href="/kontakt"
            className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Kontakt aufnehmen
          </Link>
        </div>
      </section>
    </div>
  );
}
