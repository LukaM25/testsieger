"use client";

import { useEffect, useRef, useState } from "react";
import { FlaskConical, Package, Scale, Sparkles, ShieldCheck } from "lucide-react";
import { stagger } from "@/lib/animation";
import { useLocale } from "@/components/LocaleProvider";

const criteria = [
  {
    id: "A",
    Icon: Package,
    title: { de: "Produktschutz & Verpackung", en: "Protection & packaging" },
    lead: {
      de: "Kommt das Produkt unbeschädigt an – und ist alles dabei?",
      en: "Does the product arrive undamaged, and is everything included?",
    },
    points: {
      de: ["Stabilität und sicherer Verschluss", "Schutz vor Kratzern, Feuchtigkeit und Umwelt", "Packungsinhalt und Gebrauchsanweisung", "Nachhaltigkeit der Verpackung"],
      en: ["Stability and secure closure", "Protection against scratches, moisture and environment", "Package contents and instructions", "Sustainability of the packaging"],
    },
  },
  {
    id: "B",
    Icon: Sparkles,
    title: { de: "Verarbeitung & Erscheinungsbild", en: "Workmanship & appearance" },
    lead: {
      de: "Wie hochwertig sieht das Produkt aus und fühlt es sich an?",
      en: "How high-quality does the product look and feel?",
    },
    points: {
      de: ["Verarbeitungsqualität und Präzision", "Optik und Gesamteindruck", "Stabilität im Gebrauch", "Nachhaltigkeit der Materialien"],
      en: ["Workmanship quality and precision", "Look and overall impression", "Stability in use", "Sustainability of materials"],
    },
  },
  {
    id: "C",
    Icon: FlaskConical,
    title: { de: "Praxistest", en: "Practical test" },
    lead: {
      de: "Hält das Produkt, was der Hersteller verspricht?",
      en: "Does the product deliver what the manufacturer promises?",
    },
    points: {
      de: ["Werbeversprechen im Vergleich zur Realität", "Funktion und Bedienkomfort", "Leistung in Alltagssituationen", "Bewertung besonderer Merkmale"],
      en: ["Advertised promises versus reality", "Function and ease of use", "Performance in everyday situations", "Assessment of unique features"],
    },
  },
  {
    id: "D",
    Icon: Scale,
    title: { de: "Preis-Leistung & Nutzerstimmen", en: "Value & user opinions" },
    lead: {
      de: "Steht der Preis in einem fairen Verhältnis zur Leistung?",
      en: "Is the price fair for the performance delivered?",
    },
    points: {
      de: ["Preis-Leistungs-Analyse", "Vergleich mit dem Marktsegment", "Auswertung realer Nutzermeinungen"],
      en: ["Price-performance analysis", "Comparison with the market segment", "Evaluation of real user opinions"],
    },
  },
];

const principles = [
  { de: "Unabhängige, qualifizierte Prüfer", en: "Independent, qualified testers" },
  { de: "Einheitliche, dokumentierte Methodik", en: "Consistent, documented method" },
  { de: "Transparente, nachvollziehbare Ergebnisse", en: "Transparent, traceable results" },
];

const SEAL_FROM = 64; // Prozent

export default function PruefKriterien() {
  const { locale } = useLocale();
  const tr = (de: string, en: string) => (locale === "en" ? en : de);
  const scaleRef = useRef<HTMLDivElement | null>(null);
  const [scaleVisible, setScaleVisible] = useState(false);

  useEffect(() => {
    const el = scaleRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setScaleVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setScaleVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-12">
      {/* Kopf */}
      <div className="mx-auto max-w-3xl text-center">
        <span className="eyebrow">{tr("Vertrauen durch Prüfung", "Trust through testing")}</span>
        <h3 className="section-title">{tr("Das Testsieger-Check-System", "The Testsieger-Check system")}</h3>
        <div className="mx-auto mt-5 h-0.5 w-14 rounded-full bg-gradient-to-r from-sky-300 to-sky-600" />
        <p className="lead mt-6">
          {tr(
            "Jedes Produkt wird nach denselben vier Kriterien bewertet, mit 1 bis 10 Punkten (halbe Punkte möglich). So bleibt jedes Ergebnis fair, vergleichbar und nachvollziehbar.",
            "Every product is rated on the same four criteria, from 1 to 10 points (half points possible). This keeps every result fair, comparable and traceable."
          )}
        </p>
      </div>

      {/* Vier Kriterien */}
      <div className="grid gap-6 sm:grid-cols-2">
        {criteria.map(({ id, Icon, title, lead, points }, index) => (
          <div key={id} data-animate="card" style={stagger(index)} className="h-full">
            <div className="group relative h-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[0_18px_50px_-35px_rgba(43,64,102,0.35)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_28px_60px_-35px_rgba(43,64,102,0.5)]">
              <span
                aria-hidden
                className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-gradient-to-br from-sky-100 to-transparent opacity-60 blur-2xl transition-opacity duration-700 group-hover:opacity-100"
              />
              <div className="relative mb-6 flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 text-sky-700 ring-1 ring-sky-100 transition duration-500 group-hover:scale-105 group-hover:-rotate-3">
                  <Icon className="h-6 w-6" strokeWidth={1.5} />
                </span>
                <span className="text-4xl font-semibold tracking-tight text-slate-200 transition-colors duration-500 group-hover:text-sky-200">{id}</span>
              </div>
              <h4 className="card-title relative !mb-2">{tr(title.de, title.en)}</h4>
              <p className="relative mb-5 text-sm font-medium text-sky-700">{tr(lead.de, lead.en)}</p>
              <ul className="relative space-y-2.5">
                {(locale === "en" ? points.en : points.de).map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-slate-600">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                    {point}
                  </li>
                ))}
              </ul>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-sky-300 via-sky-500 to-sky-700 transition-transform duration-500 group-hover:scale-x-100"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Gesamtnote */}
      <div
        ref={scaleRef}
        data-animate="card"
        className="rounded-3xl bg-gradient-to-br from-[#16294d] to-[#0b1730] p-8 text-white shadow-[0_30px_70px_-40px_rgba(11,23,48,0.8)] sm:p-10"
      >
        <div className="grid items-center gap-8 md:grid-cols-[1fr_1.2fr]">
          <div>
            <span className="mb-3 block text-xs font-medium uppercase tracking-[0.22em] text-sky-300/90">
              {tr("Gesamtnote", "Overall score")}
            </span>
            <h4 className="text-2xl font-semibold tracking-tight text-white">
              {tr("Der gewichtete Durchschnitt entscheidet", "The weighted average decides")}
            </h4>
            <p className="mt-4 leading-relaxed text-slate-300">
              {tr(
                "Aus den vier Kriterien A bis D bilden wir den gewichteten Durchschnitt. Er ergibt die Gesamtnote und ist die Grundlage für Prüfbericht, Zertifikat und Siegel.",
                "We take the weighted average of the four criteria A to D. It forms the overall score and is the basis for the test report, certificate and seal."
              )}
            </p>
          </div>

          <div>
            <div className="mb-3 flex items-end justify-between text-xs text-slate-400">
              <span>0</span>
              <span>10 {tr("Punkte", "points")}</span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-400 to-sky-200 transition-[width] duration-[1600ms] ease-out"
                style={{ width: scaleVisible ? "100%" : "0%" }}
              />
              <div
                className="absolute inset-y-0 right-0 rounded-r-full bg-white/25 transition-opacity delay-1000 duration-700"
                style={{ width: `${100 - SEAL_FROM}%`, opacity: scaleVisible ? 1 : 0 }}
              />
            </div>
            <div className="relative mt-3 h-6">
              <span
                className="absolute -translate-x-1/2 text-xs font-medium text-sky-200 transition-opacity delay-1000 duration-700"
                style={{ left: `${SEAL_FROM}%`, opacity: scaleVisible ? 1 : 0 }}
              >
                {SEAL_FROM} %
              </span>
            </div>
            <p className="mt-1 flex items-start gap-2 text-sm text-slate-300">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" strokeWidth={1.75} />
              {tr(
                `Zertifikat und Siegel gibt es ab einem Testergebnis von ${SEAL_FROM} % (Note 3,0). Schlechter bewertete Produkte erhalten kein Siegel.`,
                `Certificate and seal are issued from a test result of ${SEAL_FROM}% (grade 3.0). Products rated lower do not receive a seal.`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Qualitätsprinzipien */}
      <ul className="flex flex-wrap justify-center gap-3">
        {principles.map((p, i) => (
          <li
            key={p.de}
            data-animate="card"
            style={stagger(i)}
            className="rounded-full border border-slate-200/80 bg-white px-5 py-2 text-sm text-slate-600 shadow-sm"
          >
            {tr(p.de, p.en)}
          </li>
        ))}
      </ul>

      <div className="flex justify-center">
        <a
          href="/verfahrenpdf/pruefkriterium.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#16294d] px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em] !text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          {tr("Alle Details (PDF)", "Full details (PDF)")}
        </a>
      </div>
    </div>
  );
}
