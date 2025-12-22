import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Prüfverfahren – Prüfsiegel Zentrum UG',
  description:
    'Überblick über den standardisierten Prüfprozess vom Erstgespräch über Laboranalysen bis zur Lizenzierung des Prüfsiegels.',
};

const phases = [
  {
    title: '1. Vorqualifizierung',
    description:
      'Kostenloser Pre-Check inklusive Dokumentenprüfung und Plausibilitätsbewertung, um Aufwand und benötigte Nachweise frühzeitig abzuschätzen.',
    actions: [
      { label: 'Pre-Check starten', href: '/precheck' },
      { label: 'Unterlagen-Checkliste', href: '/dashboard' },
    ],
  },
  {
    title: '2. Technische Analyse',
    description:
      'Labor- und Feldtests nach DIN EN ISO/IEC 17025. Wir arbeiten mit spezialisierten Partnerlaboren und dokumentieren jeden Messschritt.',
    actions: [
      { label: 'Beispiel-Report ansehen', href: '/lizenzen' },
    ],
  },
  {
    title: '3. Bewertung & Gutachten',
    description:
      'Zusammenführen aller Messergebnisse, Abgleich mit Branchenbenchmarks sowie Erstellung eines Gutachtens inklusive Handlungsempfehlungen.',
    actions: [
      { label: 'Beratung anfordern', href: '/kontakt' },
    ],
  },
  {
    title: '4. Lizenzierung & Monitoring',
    description:
      'Bei erfolgreicher Bewertung vergeben wir die Nutzungslizenz des Prüfsiegels. Anschließend überwachen wir Produktänderungen und Feedbackkanäle.',
    actions: [
      { label: 'Lizenzbedingungen', href: '/lizenzen' },
      { label: 'Monitoring buchen', href: '/pakete' },
    ],
  },
];

const qa = [
  {
    question: 'Was genau wird geprüft?',
    answer:
      'Wir prüfen Konsumprodukte anhand klar definierter, transparenter Prüfkriterien nach DPI-Standard.\nJe nach Produktkategorie bewerten wir u. a. Verarbeitung, Funktion, Sicherheit, Praxistauglichkeit und Dokumentation. Die Prüfung erfolgt nachvollziehbar und wird schriftlich dokumentiert.',
  },
  {
    question: 'Warum gibt es eine jährliche Lizenz?',
    answer:
      'Qualität ist kein einmaliger Zustand. Die Jahreslizenz stellt sicher, dass:\n• das Produkt weiterhin unverändert ist,\n• das Siegel aktuell bleibt,\n• Missbrauch ausgeschlossen wird.\nOhne aktive Lizenz erlischt das Nutzungsrecht am Siegel.',
  },
  {
    question: 'Wie lange dauert die Prüfung?',
    answer:
      'Nach Eingang des Produkts planen wir für den vollständigen Produkttest inklusive Prüfbericht und Zertifikat 14–21 Tage ein.\nMit unserem Prioritäts-Service kann die Bearbeitungszeit auf 7 Tage reduziert werden.',
  },
  {
    question: 'Was passiert, wenn ich die Lizenz kündige?',
    answer:
      'Nach Kündigung und Ende des Gültigkeitszeitraums:\n• erlischt das Nutzungsrecht am Siegel,\n• muss das Siegel aus allen Kanälen entfernt werden,\n• darf nicht weiter mit der Auszeichnung geworben werden.',
  },
  {
    question: 'Was passiert, wenn mein Produkt die Prüfung nicht besteht?',
    answer:
      'Sie erhalten eine klare, sachliche Rückmeldung, welche Punkte nicht erfüllt wurden. Sie können Ihr Produkt anpassen und erneut kostenlos zur Prüfung einreichen.\nEin Siegel wird erst nach bestandener Prüfung vergeben. Die Lizenzgebühren werden erst nach bestandener Prüfung fällig – vorab ist lediglich die Gebühr für den Prüfaufwand zu entrichten.',
  },
  {
    question: 'Was erhalte ich nach bestandener Prüfung?',
    answer:
      'Nach bestandener Prüfung erhalten Sie direkt das Testergebnis und können den passenden Lizenzplan auswählen.\nSie erhalten einen detaillierten Prüfbericht (vollständig für Ihre Unterlagen), zusätzlich wird das Ergebnis unter der zugeordneten Produktkategorie beim Deutschen Prüfsiegel Institut veröffentlicht.\nDarüber hinaus erhalten Sie ein Zertifikat (abrufbar via QR-Code auf dem Siegel) sowie das Siegel als PNG-Datei zur vereinbarten Nutzung auf Verpackung, Website oder Marketingmaterialien.',
  },
];

export default function VerfahrenPage() {
  return (
    <div className="bg-gray-50">
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-16 pt-24 md:flex-row md:items-center">
          <div className="md:w-3/5">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Prozess</p>
            <h1 className="mt-2 text-4xl font-bold text-slate-900 md:text-5xl">Unser Prüfverfahren</h1>
            <p className="mt-4 text-lg text-slate-600">
              Transparenter Ablauf vom ersten Gespräch bis zur Siegelvergabe. Jeder Schritt ist dokumentiert und lässt sich nahtlos in bestehende Qualitätsmanagement-Systeme einbinden.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/kontakt"
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-black"
              >
                Beratungsgespräch buchen
              </Link>
              <Link
                href="#phasen"
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
              >
                Ablauf anzeigen
              </Link>
            </div>
          </div>
          <div className="relative w-full md:w-2/5">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-900/90 shadow-xl">
              <Image
                src="/images/placeholders/hero-fallback.svg"
                alt="Illustration eines Prüfpfads"
                width={800}
                height={600}
                className="h-full w-full object-cover"
                priority
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/80 to-transparent p-4 text-xs text-white">
                Platzhalter-Visual für Prozessgrafik
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="phasen" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          {phases.map((phase) => (
            <article
              key={phase.title}
              className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-[2px] hover:shadow-lg"
            >
              <h2 className="text-xl font-semibold text-slate-900">{phase.title}</h2>
              <p className="text-sm leading-relaxed text-slate-600">{phase.description}</p>
              <div className="flex flex-wrap gap-2">
                {phase.actions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-semibold text-slate-900">Häufige Fragen</h2>
          <div className="mt-8 space-y-6">
            {qa.map((item) => (
              <details key={item.question} className="group rounded-2xl border border-slate-200 bg-slate-50">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 [&::-webkit-details-marker]:hidden">
                  <h3 className="text-lg font-semibold text-slate-900">{item.question}</h3>
                  <span className="text-slate-400 transition group-open:rotate-180">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6">
                  <p className="whitespace-pre-line text-sm text-slate-600">{item.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
