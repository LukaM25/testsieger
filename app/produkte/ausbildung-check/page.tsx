import Link from 'next/link';

export const metadata = {
  title: 'Ausbildung Check – Prüfsiegel Zentrum UG',
  description:
    'Transparente Bewertung von Ausbildungsplätzen: Praxisnähe, Betreuung, Erfolgsquote – objektiv geprüft.',
};

export default function AusbildungCheckPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Ausbildung&nbsp;Check
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-700">
            Wir bewerten Ausbildungsbetriebe nach klaren, transparenten Kriterien.
            Ziel: verlässliche Orientierung für Bewerber und messbare Qualität für Betriebe.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/precheck"
              className="rounded-lg bg-black px-5 py-3 text-white hover:bg-gray-900"
            >
              Jetzt kostenloser Pre-Check
            </Link>
            <Link
              href="/kontakt"
              className="rounded-lg border px-5 py-3 hover:bg-gray-100"
            >
              Kontakt aufnehmen
            </Link>
          </div>
        </div>
      </section>

      {/* What we check */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-2xl font-semibold">Was wird geprüft?</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Praxisnähe & Ausbildungsplan',
              text:
                'Gibt es einen strukturierten Plan je Ausbildungsjahr? Wie gut ist die Verzahnung von Theorie und Praxis?',
            },
            {
              title: 'Betreuung & Feedback',
              text:
                'Ansprechpersonen, Mentoring, Feedback-Zyklen und dokumentierte Lernfortschritte.',
            },
            {
              title: 'Erfolgsquote & Übernahme',
              text:
                'Bestehensquoten, Anteil der Übernahmen, Entwicklungsperspektiven nach Abschluss.',
            },
            {
              title: 'Arbeitsschutz & Organisation',
              text:
                'Einhaltung gesetzlicher Vorgaben, Jugendarbeitsschutz, Arbeitszeiten, Schichtmodelle.',
            },
            {
              title: 'Ausstattung & Lernumgebung',
              text:
                'Arbeitsmittel, Software/Tools, Lernräume, Zugang zu Übungsmaterial.',
            },
            {
              title: 'Transparenz & Kommunikation',
              text:
                'Onboarding, Info-Materialien, regelmäßige Abstimmungen zwischen Betrieb/Schule/Azubi.',
            },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border bg-white p-6">
              <div className="text-lg font-medium">{c.title}</div>
              <p className="mt-2 text-gray-600">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-semibold">Ablauf</h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              {
                n: '1',
                t: 'Pre-Check (0 €)',
                d: 'Betrieb meldet sich an und liefert Basisdaten (Dauer: 3–5 Minuten).',
              },
              {
                n: '2',
                t: 'Dokumenten-Review',
                d: 'Ausbildungspläne, Nachweise, Feedback-Vorlagen. Rückfragen bei Bedarf.',
              },
              {
                n: '3',
                t: 'Bewertung & Siegel',
                d: 'Prüfbericht + Siegel mit QR-Verifikation. Optional: Veröffentlichung der Ergebnisse.',
              },
            ].map((s) => (
              <li key={s.n} className="rounded-xl border p-6">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                  {s.n}
                </div>
                <div className="text-lg font-medium">{s.t}</div>
                <p className="mt-1 text-gray-600">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <Link
              href="/packages"
              className="rounded-lg bg-black px-5 py-3 text-white hover:bg-gray-900"
            >
              Pakete ansehen
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ placeholder */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-2xl font-semibold">FAQ</h2>
        <div className="mt-6 space-y-4">
          {[
            {
              q: 'Wie lange dauert die Prüfung?',
              a: 'Regulär bis zu 21 Werktage nach Eingang der Unterlagen. Priority-Option 7 Werktage verfügbar.',
            },
            {
              q: 'Ist der Bericht öffentlich?',
              a: 'Optional. Das Siegel enthält einen QR-Code, der auf eine Verifikationsseite verweist.',
            },
            {
              q: 'Welche Kosten fallen an?',
              a: 'Entsprechend Ihres Pakets (Basic/Premium oder Lifetime). Die Prüfkosten sind inklusive.',
            },
          ].map((f) => (
            <div key={f.q} className="rounded-xl border bg-white p-5">
              <div className="font-medium">{f.q}</div>
              <p className="mt-1 text-gray-600">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
