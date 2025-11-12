import React from "react";
import Link from "next/link";

export default function ProduktTestPage() {
  // NOTE: Prices can be wired to your CONFIG/store; hardcoded here as placeholders.
  const pricing = {
    baseFee: 254,
    basic: { daily: 0.99, label: "Basic", channels: "DE, 1 Kanal" },
    premium: { daily: 1.54, label: "Premium", channels: "EU, alle Kanäle" },
    lifetime: { oneTime: 1477, label: "Lifetime", channels: "EU, alle Kanäle, LT-Lizenz" }
  };

  const formatEUR = (n: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-6 space-y-6">
        <div className="grid gap-8 md:grid-cols-[1.1fr,0.9fr] items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Testsieger Check</h1>
            <p className="text-xl text-slate-600 mt-3">Vertrauen durch Prüfung</p>
            <p className="mt-4 max-w-3xl text-slate-700">
              Ein Qualitätssiegel, das zeigt, ob Ihr Produkt die Lizenzkriterien erfüllt – transparent, objektiv und nachvollziehbar.
            </p>
          </div>
          <div className="flex justify-center">
            <img
              src="/siegel.png"
              alt="Testsieger Check Siegel"
              loading="lazy"
              decoding="async"
              className="w-full max-w-sm rounded-[32px] shadow-2xl shadow-slate-900/20"
            />
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-50 p-6 shadow-sm md:flex md:items-center md:gap-6">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white shadow">
            <img
              src="/siegel.png"
              alt="Testsieger Check Siegel"
              loading="lazy"
              decoding="async"
              className="h-20 w-20 object-contain"
            />
          </div>
          <div className="mt-4 space-y-2 md:mt-0">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Testsieger Check Siegel</p>
            <p className="text-sm text-slate-600">
              Unser Siegel steht für unabhängige Prüfung, klare Kriterien und messbare Qualität – perfekt für Verbrauchervertrauen.
            </p>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid gap-6 rounded-3xl border border-slate-200 bg-slate-950/5 p-6 shadow-sm md:grid-cols-3">
          {[
            {
              label: "120+",
              title: "geprüfte Produkte",
              detail: "Marke, Verarbeitung & Handhabung – wir verifizieren jeden Claim.",
            },
            {
              label: "48h",
              title: "erster Prüfbericht",
              detail: "Schnelle Priorisierung mit klaren Benchmarks für Ihre Launch-Zeitachse.",
            },
            {
              label: "10 Punkte",
              title: "Skala",
              detail: "Halbe Punkte erlauben eine präzise Bewertung und differenzierte Notenvergabe.",
            },
          ].map((item) => (
            <div key={item.label} className="space-y-1 rounded-2xl bg-white/80 p-5 shadow-sm">
              <p className="text-3xl font-bold text-slate-900">{item.label}</p>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{item.title}</p>
              <p className="text-sm text-slate-600">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prüfschwerpunkte */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-slate-200 bg-slate-50/80 p-6 shadow-lg shadow-slate-900/10">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold">Was wir für Sie dokumentieren</h2>
            <p className="mt-3 text-sm text-slate-600">
              Unsere Prüfberichte verbinden qualitative Beobachtungen mit quantitativen Daten. Die Dokumentation
              enthält Dateiaufnahmen, Notenvergabe für jeden Punkt und nachvollziehbare Empfehlungen für Verbraucher.
            </p>
          </div>
          <div className="grow border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Transparente Verbreitung</p>
            <p>Digital signierte PDFs, Einbindung auf Produktseiten und Social Proof über Siegel-Assets.</p>
          </div>
        </div>
      </section>

      {/* Ablauf */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Ablauf</h2>
            <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Effizient & transparent</span>
          </div>
          <ol className="mt-8 grid gap-6 md:grid-cols-2">
            {[
              "Kostenloser PRE‑CHECK",
              "Lizenzplan auswählen",
              "Produkt an uns senden",
              "Testergebnis und Siegel erhalten"
            ].map((s, i) => (
              <li
                key={i}
                className="flex flex-col gap-3 rounded-2xl border border-white bg-white/60 px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">{i + 1}</span>
                <p className="font-medium text-slate-900">{s}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pre-Check Banner */}
      <section className="w-full border-y border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-semibold">Pre Check</h3>
            <p className="mt-1 text-lg text-slate-200">
              Kostenloser Pre Check (0 €) – dauert nur ca. 3 Minuten und zeigt sofort, ob Ihr Produkt prüfbereit ist.
            </p>
          </div>
          <button className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-black/30">
            Jetzt starten
          </button>
        </div>
      </section>

      {/* Vorteile */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Dein Vorteil</h2>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Fokus auf Klartext</p>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Erhöht Sichtbarkeit",
              detail: "Mehr Reichweite durch transparente Prüfberichte, die Vertrauen schaffen.",
            },
            {
              title: "Steigert Conversion Rate",
              detail: "Sichtbare Auszeichnung steigert Kaufbereitschaft und hebt Ihr Produkt hervor.",
            },
            {
              title: "Senkt Marketingausgaben",
              detail: "Vertrauen durch Qualität ersetzt teure Werbebudgets und schafft Loyalität.",
            },
          ].map((f) => (
            <div key={f.title} className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white" aria-hidden="true">
                ✅
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">{f.title}</p>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lizenz-Pakete */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="text-2xl font-semibold">Lizenz‑Pakete</h2>
        <p className="text-slate-600 mb-6">Jedes Paket beinhaltet {formatEUR(pricing.baseFee)} Grundgebühr für das Testverfahren.</p>
        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-b from-sky-50 to-white p-6 shadow border">
            <h3 className="font-semibold">Basic</h3>
            <p className="text-slate-700">{formatEUR(pricing.baseFee)} + {formatEUR(pricing.basic.daily)} / Tag</p>
            <p className="text-slate-500">{pricing.basic.channels}</p>
            <button className="mt-3 px-4 py-2 rounded-xl bg-slate-900 text-white">Auswählen</button>
          </div>
          <div className="rounded-2xl bg-gradient-to-b from-sky-50 to-white p-6 shadow border">
            <h3 className="font-semibold">Premium</h3>
            <p className="text-slate-700">{formatEUR(pricing.baseFee)} + {formatEUR(pricing.premium.daily)} / Tag</p>
            <p className="text-slate-500">{pricing.premium.channels}</p>
            <button className="mt-3 px-4 py-2 rounded-xl bg-slate-900 text-white">Auswählen</button>
          </div>
          <div className="rounded-2xl bg-gradient-to-b from-sky-50 to-white p-6 shadow border">
            <h3 className="font-semibold">Lifetime</h3>
            <p className="text-slate-700">{formatEUR(pricing.lifetime.oneTime)}</p>
            <p className="text-slate-500">{pricing.lifetime.channels}</p>
            <button className="mt-3 px-4 py-2 rounded-xl bg-slate-900 text-white">Auswählen</button>
          </div>
        </div>
      </section>

      {/* Prüfverfahren Teaser + CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="text-2xl font-semibold mb-3">Unser Prüfverfahren</h2>
        <p className="text-slate-700 mb-6">Unser Prüfverfahren folgt einem einheitlichen TCPZ‑Standard mit klaren, messbaren Kriterien.</p>
        <Link href="/pruefverfahren" className="inline-flex items-center rounded-xl bg-slate-900 px-5 py-3 text-white">
          ZUM PRÜFVERFAHREN
        </Link>
      </section>
    </main>
  );
}
