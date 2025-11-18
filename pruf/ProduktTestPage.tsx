  "use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { PackageCard } from "@/components/PackageCard";
import { stagger } from "@/lib/animation";
import PrecheckPage from "@/app/precheck/page";

type StepCard = {
  src: string;
  label: string;
};

const steps: StepCard[] = [
  { src: "/images/ablauf/1free.PNG", label: "Kostenloser PRE-CHECK" },
  { src: "/images/ablauf/2lizenz.PNG", label: "Lizenzplan auswählen" },
  { src: "/images/ablauf/3liefer.PNG", label: "Produkt an uns senden" },
  { src: "/images/ablauf/4testergebnis.PNG", label: "Testergebnis & Siegel erhalten" },
];

const stepSequence = (() => {
  const sequence: Array<{ type: "card"; card: StepCard } | { type: "arrow"; key: string }> = [];
  steps.forEach((step, index) => {
    sequence.push({ type: "card", card: step });
    if (index < steps.length - 1) {
      sequence.push({ type: "arrow", key: `arrow-${index}` });
    }
  });
  return sequence;
})();

const advantanges = [
  { src: "/images/iconen/sichtbarkeit.png", label: "Erhöht Sichtbarkeit" },
  { src: "/images/iconen/conversion.png", label: "Steigert Conversion Rate" },
  { src: "/images/iconen/marketingausgaben.png", label: "Senkt Marketingausgaben" },
];

const verfahrenHighlights = [
  { src: "/images/iconen/transparenz.PNG", label: "Transparenz" },
  { src: "/images/iconen/glaub.PNG", label: "Glaubwürdigkeit" },
  { src: "/images/iconen/qualitat.PNG", label: "Qualität" },
];

// Reuse the full precheck page component here to keep validation and behavior consistent

const phasesQa = {
  phases: [
    {
      title: '1. Vorqualifizierung',
      description: 'Kostenloser Pre-Check inklusive Dokumentenprüfung und Plausibilitätsbewertung, um Aufwand und benötigte Nachweise frühzeitig abzuschätzen.',
      actions: [ { label: 'Pre-Check starten', href: '/precheck' }, { label: 'Unterlagen-Checkliste', href: '/kundenportal' } ],
    },
    {
      title: '2. Technische Analyse',
      description: 'Labor- und Feldtests nach DIN EN ISO/IEC 17025. Wir arbeiten mit spezialisierten Partnerlaboren und dokumentieren jeden Messschritt.',
      actions: [ { label: 'Beispiel-Report ansehen', href: '/testergebnisse' } ],
    },
    {
      title: '3. Bewertung & Gutachten',
      description: 'Zusammenführen aller Messergebnisse, Abgleich mit Branchenbenchmarks sowie Erstellung eines Gutachtens inklusive Handlungsempfehlungen.',
      actions: [ { label: 'Beratung anfordern', href: '/kontakt' } ],
    },
    {
      title: '4. Lizenzierung & Monitoring',
      description: 'Bei erfolgreicher Bewertung vergeben wir die Nutzungslizenz des Prüfsiegels. Anschließend überwachen wir Produktänderungen und Feedbackkanäle.',
      actions: [ { label: 'Lizenzbedingungen', href: '/lizenzen' }, { label: 'Monitoring buchen', href: '/pakete' } ],
    },
  ],
  qa: [
    { question: 'Wie lange dauert der gesamte Prozess?', answer: 'Je nach Produktkategorie beträgt die Durchlaufzeit zwischen 3 und 8 Wochen. Express-Optionen sind nach Absprache möglich.' },
    { question: 'Welche Unterlagen benötigen wir?', answer: 'Mindestens technische Spezifikationen, Sicherheitsnachweise und – falls vorhanden – bisherige Auditberichte. Eine Checkliste erhalten Sie nach dem Pre-Check.' },
    { question: 'Sind internationale Prüfungen möglich?', answer: 'Ja. Wir koordinieren Laborpartner in EU, UK und USA und liefern ein abgestimmtes Gutachten für alle Märkte.' },
  ],
};

export default function ProduktTestPage() {
  const [packageLoading, setPackageLoading] = useState<string | null>(null);
  const [showPrecheck, setShowPrecheck] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [contentMaxHeight, setContentMaxHeight] = useState<string>('0px');

  // update max-height when showPrecheck toggles to enable smooth height transition
  useEffect(() => {
    if (!contentRef.current) return;
    if (showPrecheck) {
      const h = contentRef.current.scrollHeight;
      // set to actual scrollHeight to animate open
      setContentMaxHeight(`${h}px`);
      // after transition, allow it to grow if content changes
      const t = setTimeout(() => setContentMaxHeight('none'), 300);
      return () => clearTimeout(t);
    } else {
      // collapse: set to measured height first (in case it's 'none') then to 0 to animate
      const h = contentRef.current.scrollHeight;
      setContentMaxHeight(`${h}px`);
      // next frame set to 0 to trigger transition
      requestAnimationFrame(() => requestAnimationFrame(() => setContentMaxHeight('0px')));
    }
  }, [showPrecheck]);

  async function choosePackage(plan: string) {
    try {
      setPackageLoading(plan);
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || 'Fehler');
      window.location.href = data.url;
    } finally {
      setPackageLoading(null);
    }
  }

  return (
    <main className="bg-white text-slate-900">
      <section className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 sm:flex-row sm:items-center sm:justify-between lg:py-20">
  <div className="space-y-6 max-w-xl">
          <div className="flex items-center gap-4">
            <div>
              <p data-animate="hero-badge" className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500"></p>
              <Image src="/tclogo.png" alt="TC Logo" width={525} height={138} className="mb-4 h-[110px] w-[220px] object-contain" />
            </div>
          </div>
          <h1 data-animate="hero-title" className="text-3xl font-bold">Ihr Produkt verdient Vertrauen.</h1>
          <p data-animate="hero-text" className="text-sm text-slate-600">
            Wir begleiten Sie vom Pre-Check bis zum Siegel – transparent, digital und mit einem klaren Bewertungsrahmen.
          </p>
          <div>
            <a data-animate="hero-cta" href="/precheck" className="inline-flex mt-3 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg transition hover:bg-black">Jetzt Pre-Check</a>
          </div>
        </div>
        {/* right-side visual: place siegel image inside the empty column */}
        <div data-animate="hero-image" className="flex sm:flex-1 sm:items-center sm:justify-end relative z-10 lg:pr-[30%]">
          <div className="flex items-center justify-center max-w-[280px] w-full">
            <Image
              src="/siegel.png"
              alt="Testsieger Siegel"
              width={260}
              height={260}
              className="w-full object-contain"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold">Ablauf</h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-6 md:flex-row md:flex-nowrap">
          {stepSequence.map((entry, idx) =>
            entry.type === "card" ? (
              <div
                key={`card-${entry.card.label}`}
                data-animate="card"
                style={stagger(idx)}
                className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm w-[clamp(180px,22vw,240px)]"
              >
                <div className="flex justify-center">
                  <Image
                    src={entry.card.src}
                    alt={entry.card.label}
                    width={96}
                    height={96}
                    className="h-20 w-20 object-contain"
                  />
                </div>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">
                  {entry.card.label}
                </p>
              </div>
            ) : (
              <div key={entry.key} className="flex items-center" data-animate="card" style={stagger(idx)}>
                <Image
                  src="/arrow.png"
                  alt="Pfeil"
                  width={64}
                  height={64}
                  className="h-[clamp(28px,4vw,48px)] w-auto object-contain"
                />
              </div>
            )
          )}
        </div>
      </section>
      {/* Inserted Pre-Check form inline so the Produkt Test page is self-contained */}
      <section id="precheck" className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex flex-col items-center gap-4 rounded-full bg-indigo-900 px-6 py-8 text-black">
          <button
            type="button"
            onClick={() => setShowPrecheck((s) => !s)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowPrecheck((s) => !s); }}
            className="flex w-full flex-col items-center gap-1 rounded-full bg-white px-14 py-6 text-center text-black shadow-[0_20px_40px_rgba(15,23,42,0.25)] transition hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 border border-3 border-indigo-600 ring-3 ring-indigo-700/90"
            aria-expanded={showPrecheck}
            aria-controls="precheck-content"
          >
            <span className="text-2xl font-semibold tracking-[0.18em]">Kostenloser Pre-Check</span>
            <span className="text-sm font-semibold uppercase tracking-[0.28em] text-black/70">(Dauert nur 3 Minuten)</span>
            <svg
              className={`h-6 w-6 transition-transform duration-200 ${showPrecheck ? 'rotate-180' : 'rotate-0'}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.06z" />
            </svg>
          </button>
        </div>

        <div
          className="mt-6 overflow-hidden transition-all duration-300 ease-in-out"
          // if contentMaxHeight is 'none' we don't set maxHeight style so it can grow naturally
          style={{ maxHeight: contentMaxHeight === 'none' ? undefined : contentMaxHeight, opacity: showPrecheck ? 1 : 0 }}
          aria-hidden={!showPrecheck}
        >
          <div ref={contentRef} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-slate-900">
            <PrecheckPage />
          </div>
        </div>
      </section>

      {/* Vorteile / Highlights */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Dein Vorteil</h2>
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">klar & strukturiert</span>
        </div>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {advantanges.map((item, i) => (
            <div
              key={item.label}
              data-animate="card"
              style={stagger(i)}
              className="relative flex flex-col items-center gap-5 rounded-[40px] border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200 w-[clamp(240px,32vw,360px)]"
            >
              <span className="absolute right-3 top-3 rounded-full bg-slate-100 p-1 shadow-inner">
                <Image src="/checkmark.png" alt="Check" width={22} height={22} className="h-5 w-5 object-contain" />
              </span>
              <Image src={item.src} alt={item.label} width={96} height={96} className="h-20 w-20 object-contain" />
              <p className="text-xl font-semibold text-slate-900">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pakete section using PackageCard */}
      <section id="pakete" className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Lizenz-Pakete</h2>
          <p className="text-sm text-slate-500">Einfache Preisstruktur on top</p>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div data-animate="card" style={stagger(0)}>
            <PackageCard title="Basic" price="254€ + 0,99€/Tag" subtitle="DE, 1 Kanal" onSelect={() => choosePackage('BASIC')} />
          </div>
          <div data-animate="card" style={stagger(1)}>
            <PackageCard title="Premium" price="254€ + 1,54€/Tag" subtitle="EU, alle Kanäle" onSelect={() => choosePackage('PREMIUM')} />
          </div>
          <div data-animate="card" style={stagger(2)}>
            <PackageCard title="Lifetime" price="1477€" subtitle="EU, alle Kanäle, LT-Lizenz" onSelect={() => choosePackage('LIFETIME')} />
          </div>
        </div>
      </section>

      {/* Prüfverfahren and FAQ */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr,0.9fr]">
          <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg">
            <h2 className="text-2xl font-semibold">Unser Prüfverfahren</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {verfahrenHighlights.map((item, i) => (
                <div key={item.label} data-animate="card" style={stagger(i)} className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 p-4 text-center">
                  <Image src={item.src} alt={item.label} width={48} height={48} className="h-12 w-12" />
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">{item.label}</p>
                </div>
              ))}
            </div>
            <Link
              href="#pruefverfahren-pdf"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg transition hover:bg-black"
            >
              Zum Prüfverfahren 
            </Link>
          </div>
          <div className="flex items-center justify-center">
            <Image src="/images/siegel21.png" alt="Siegel" width={260} height={260} className="h-60 w-auto" />
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200 bg-white pt-8">
          <h3 className="text-2xl font-semibold">Häufige Fragen</h3>
          <div className="mt-6 space-y-6">
            {phasesQa.qa.map((item, i) => (
              <div key={item.question} data-animate="card" style={stagger(i)} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h4 className="text-lg font-semibold text-slate-900">{item.question}</h4>
                <p className="mt-2 text-sm text-slate-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
