import React from "react";

type Criteria = { id: string; title: string; bullets: string[] };
type ScoringRow = { points: string; note: string; kategorie: string };
type Extract = {
  summary?: string;
  criteria?: Criteria[];
  scoring?: { scale?: string; table?: ScoringRow[] };
  quality?: string[];
  faq?: { q: string; a: string }[];
};

export default function PruefverfahrenPage(props: { data: Extract }) {
  const data = props.data ?? {};
  const criteria = Array.isArray(data.criteria) ? data.criteria : [];
  const quality = Array.isArray(data.quality) ? data.quality : [];
  const faq = Array.isArray(data.faq) ? data.faq : [];
  const scoring = data.scoring ?? {};
  const scoringRows = Array.isArray(scoring.table) ? scoring.table : [];

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-6">
        <h1 className="text-4xl font-bold tracking-tight">Prüfverfahren</h1>
        <p className="mt-2 text-slate-600">
          Objektiv, transparent und nachvollziehbar – basierend auf dokumentierten TCPZ‑Prüfkriterien.
        </p>
      </section>

      {data.summary && (
        <section className="mx-auto max-w-5xl px-4 pb-10">
          <p className="text-slate-700">{data.summary}</p>
        </section>
      )}

      {criteria.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-12">
          <h2 className="text-2xl font-semibold mb-6">Kriterien A–D</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {criteria.map((c) => {
              const bullets = Array.isArray(c.bullets) ? c.bullets : [];
              return (
                <div key={c.id} className="rounded-2xl border bg-white p-6 shadow-sm">
                  <h3 className="font-semibold mb-2">
                    {c.id}. {c.title}
                  </h3>
                  {bullets.length > 0 && (
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      {bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {(scoringRows.length > 0 || scoring.scale) && (
        <section className="mx-auto max-w-6xl px-4 pb-12">
          <h2 className="text-2xl font-semibold mb-4">Punktesystem & Notenskala</h2>
          {scoring.scale && <p className="text-slate-700 mb-4">{scoring.scale}</p>}
          {scoringRows.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="min-w-full divide-y">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-3">Punktebereich</th>
                    <th className="text-left p-3">Note</th>
                    <th className="text-left p-3">Bewertung</th>
                  </tr>
                </thead>
                <tbody>
                  {scoringRows.map((r, i) => (
                    <tr key={i} className="odd:bg-white even:bg-slate-50">
                      <td className="p-3">{r.points}</td>
                      <td className="p-3">{r.note}</td>
                      <td className="p-3">{r.kategorie}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {quality.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-12">
          <h2 className="text-2xl font-semibold mb-4">Transparenz & Qualitätssicherung</h2>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            {quality.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </section>
      )}

      {faq.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="text-2xl font-semibold mb-4">FAQ</h2>
          <div className="space-y-4">
            {faq.map((f, i) => (
              <details key={i} className="rounded-xl border p-4">
                <summary className="font-medium cursor-pointer">{f.q}</summary>
                <p className="mt-2 whitespace-pre-line text-slate-700">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <a
          href="/verfahrenpdf/pruefkriterium.pdf"
          className="inline-flex items-center rounded-xl bg-slate-900 px-5 py-3 text-white"
        >
          PDF – Prüfkriterien (Öffentlich)
        </a>
      </section>
    </main>
  );
}
