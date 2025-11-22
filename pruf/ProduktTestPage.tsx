"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { PackageCard } from "@/components/PackageCard";
import { stagger } from "@/lib/animation";
import PrecheckPage from "@/app/precheck/page";
import AnimateOnView from "@/components/AnimateOnView";
import Counter from "@/components/Counter";
import { useLocale } from "@/components/LocaleProvider";

type StepCard = {
  src: string;
  label: { de: string; en: string };
};

const steps: StepCard[] = [
  { src: "/images/ablauf/1free.PNG", label: { de: "Kostenloser PRE-CHECK", en: "Free pre-check" } },
  { src: "/images/ablauf/2lizenz.PNG", label: { de: "Lizenzplan auswählen", en: "Choose license plan" } },
  { src: "/images/ablauf/3liefer.PNG", label: { de: "Produkt an uns senden", en: "Send product to us" } },
  { src: "/images/ablauf/4testergebnis.PNG", label: { de: "Testergebnis & Siegel erhalten", en: "Receive test result & seal" } },
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
  { src: "/images/iconen/sichtbarkeit.png", label: { de: "Erhöht Sichtbarkeit", en: "Increases visibility" } },
  { src: "/images/iconen/conversion.png", label: { de: "Steigert Conversion Rate", en: "Boosts conversion rate" } },
  { src: "/images/iconen/marketingausgaben.png", label: { de: "Senkt Marketingausgaben", en: "Reduces marketing spend" } },
];

const verfahrenHighlights = [
  { src: "/images/iconen/transparenz.PNG", label: { de: "Transparenz", en: "Transparency" } },
  { src: "/images/iconen/glaub.PNG", label: { de: "Vertrauen", en: "Credibility" } },
  { src: "/images/iconen/qualitat.PNG", label: { de: "Qualität", en: "Quality" } },
];

// Reuse the full precheck page component here to keep validation and behavior consistent

const phasesQa = {
  phases: [
    {
      title: { de: '1. Vorqualifizierung', en: '1. Pre-qualification' },
      description: {
        de: 'Kostenloser Pre-Check inklusive Dokumentenprüfung und Plausibilitätsbewertung, um Aufwand und benötigte Nachweise frühzeitig abzuschätzen.',
        en: 'Free pre-check including document review and plausibility assessment to estimate effort and required evidence early.',
      },
      actions: [
        { label: { de: 'Pre-Check starten', en: 'Start pre-check' }, href: '/precheck' },
        { label: { de: 'Unterlagen-Checkliste', en: 'Documentation checklist' }, href: '/kundenportal' },
      ],
    },
    {
      title: { de: '2. Technische Analyse', en: '2. Technical analysis' },
      description: {
        de: 'Labor- und Feldtests nach DIN EN ISO/IEC 17025. Wir arbeiten mit spezialisierten Partnerlaboren und dokumentieren jeden Messschritt.',
        en: 'Lab and field tests per DIN EN ISO/IEC 17025. We work with specialized partner labs and document every measurement step.',
      },
      actions: [ { label: { de: 'Beispiel-Report ansehen', en: 'View sample report' }, href: '/testergebnisse' } ],
    },
    {
      title: { de: '3. Bewertung & Gutachten', en: '3. Evaluation & report' },
      description: {
        de: 'Zusammenführen aller Messergebnisse, Abgleich mit Branchenbenchmarks sowie Erstellung eines Gutachtens inklusive Handlungsempfehlungen.',
        en: 'Consolidating all measurements, benchmarking, and creating an expert report including recommendations.',
      },
      actions: [ { label: { de: 'Beratung anfordern', en: 'Request consultation' }, href: '/kontakt' } ],
    },
    {
      title: { de: '4. Lizenzierung & Monitoring', en: '4. Licensing & monitoring' },
      description: {
        de: 'Bei erfolgreicher Bewertung vergeben wir die Nutzungslizenz des Prüfsiegels. Anschließend überwachen wir Produktänderungen und Feedbackkanäle.',
        en: 'After a successful evaluation we issue the seal license. We then monitor product changes and feedback channels.',
      },
      actions: [
        { label: { de: 'Lizenzbedingungen', en: 'License terms' }, href: '/lizenzen' },
        { label: { de: 'Monitoring buchen', en: 'Book monitoring' }, href: '/pakete' },
      ],
    },
  ],
  qa: [
    {
      question: { de: 'Wie lange dauert der gesamte Prozess?', en: 'How long does the entire process take?' },
      answer: {
        de: 'Je nach Produktkategorie beträgt die Durchlaufzeit zwischen 14 und 21 Werktagen. Mit Buchungsoption sind 7 Werktage möglich.',
        en: 'Depending on the product category the lead time is 14–21 business days. With booking option we can deliver in 7 business days.',
      },
    },
    {
      question: { de: 'Welche Unterlagen benötigen wir?', en: 'Which documents do we need?' },
      answer: {
        de: 'Mindestens technische Spezifikationen, Sicherheitsnachweise und – falls vorhanden – bisherige Auditberichte. Eine Checkliste erhalten Sie nach dem Pre-Check.',
        en: 'At minimum technical specifications, safety proofs, and—if available—previous audit reports. You’ll receive a checklist after the pre-check.',
      },
    },
    {
      question: { de: 'Sind internationale Prüfungen möglich?', en: 'Are international tests possible?' },
      answer: {
        de: 'Ja. Wir koordinieren Laborpartner in EU, UK und USA und liefern ein abgestimmtes Gutachten für alle Märkte.',
        en: 'Yes. We coordinate lab partners in the EU, UK, and USA and provide a harmonized report for all markets.',
      },
    },
  ],
};

export default function ProduktTestPage() {
  const { locale } = useLocale();
  const tr = (de: string, en: string) => (locale === 'en' ? en : de);
  const [packageLoading, setPackageLoading] = useState<string | null>(null);
  const [showPrecheck, setShowPrecheck] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [contentMaxHeight, setContentMaxHeight] = useState<string>('0px');
  const [heroAnim, setHeroAnim] = useState(false);

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

  useEffect(() => {
    // trigger hero image entrance animation on mount
    const t = setTimeout(() => setHeroAnim(true), 60);
    return () => clearTimeout(t);
  }, []);

  async function choosePackage(plan: string) {
    try {
      setPackageLoading(plan);
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || tr('Fehler', 'Error'));
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
          <h1 data-animate="hero-title" className="text-3xl font-bold">
            {tr('Ihr Produkt verdient Vertrauen.', 'Your product deserves trust.')}
          </h1>
          <p data-animate="hero-text" className="text-sm text-slate-600">
            {tr(
              'Wir begleiten Sie vom Pre-Check bis zum Siegel – transparent, digital und mit einem klaren Bewertungsrahmen.',
              'We support you from pre-check to seal – transparent, digital, and with a clear evaluation framework.'
            )}
          </p>
          <div>
            <a data-animate="hero-cta" href="/precheck" className="inline-flex mt-3 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg transition hover:bg-black">
              {tr('Jetzt Pre-Check', 'Start pre-check')}
            </a>
          </div>
        </div>
        {/* right-side visual: layered siegel images with entrance animation */}
        <div
          data-animate="hero-image"
          className="flex flex-1 items-center justify-end relative z-10 overflow-visible"
        >
          <div
            className="relative flex items-center justify-start w-[360px] h-[360px] overflow-visible pointer-events-none"
            style={{ marginLeft: 'auto', marginRight: '-90px' }}
          >
            {/* back card */}
            <div
              className="absolute transition-all duration-[1200ms] ease-in-out will-change-transform"
              style={{
                width: '260px',
                height: '260px',
                opacity: heroAnim ? 0.85 : 0,
                transform: heroAnim
                  ? 'translate(-20%, 10%) scale(0.9)'
                  : 'translate(-120%, 10%) scale(0.8)',
              }}
            >
              <Image
                src="/siegel21.png"
                alt="Testsieger Siegel Hintergrund"
                fill
                sizes="260px"
                className="object-contain"
                priority
              />
            </div>
            {/* front card */}
            <div
              className="absolute transition-all duration-[1200ms] ease-in-out will-change-transform drop-shadow-2xl"
              style={{
                width: '280px',
                height: '280px',
                opacity: heroAnim ? 1 : 0,
                transform: heroAnim
                  ? 'translate(20%, 10%) scale(1.05)'
                  : 'translate(120%, 10%) scale(0.95)',
              }}
            >
              <Image
                src="/siegel.png"
                alt="Testsieger Siegel"
                fill
                sizes="280px"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold">{tr('Ablauf', 'Process')}</h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-6 md:flex-row md:flex-nowrap">
          {stepSequence.map((entry, idx) =>
            entry.type === "card" ? (
              <div
                key={`card-${entry.card.label.de}`}
                data-animate="card"
                style={stagger(idx)}
                className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm w-[clamp(180px,22vw,240px)]"
              >
                <div className="flex justify-center">
                  <Image
                    src={entry.card.src}
                    alt={entry.card.label.en}
                    width={96}
                    height={96}
                    className="h-20 w-20 object-contain"
                  />
                </div>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">
                  {tr(entry.card.label.de, entry.card.label.en)}
                </p>
              </div>
            ) : (
              <div key={entry.key} className="flex items-center" data-animate="card" style={stagger(idx)}>
                <Image
                  src="/arrow.png"
                  alt={tr('Pfeil', 'Arrow')}
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
            <span className="text-2xl font-semibold tracking-[0.18em]">
              {tr('Kostenloser Pre-Check', 'Free pre-check')}
            </span>
            <span className="text-sm font-semibold uppercase tracking-[0.28em] text-black/70 inline-flex items-center justify-center gap-2">
              {tr('(Dauert nur 3 Minuten)', '(Takes only 3 minutes)')}
              <Image 
                src="/images/iconen/stopwatch.png"
                alt="Stopwatch" 
                width={28} 
                height={28} 
                className="opacity-70 pb-1"
              />
            </span>
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
          <h2 className="text-2xl font-semibold">{tr('Dein Vorteil', 'Your benefit')}</h2>
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">{tr('klar & strukturiert', 'clear & structured')}</span>
        </div>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {advantanges.map((item, i) => (
            <div
              key={item.label.de}
              data-animate="card"
              style={stagger(i)}
              className="relative flex flex-col items-center gap-5 rounded-[40px] border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200 w-[clamp(240px,32vw,360px)]"
            >
              <span className="absolute right-3 top-3 rounded-full bg-slate-100 p-1 shadow-inner">
                <Image src="/checkmark.png" alt="Check" width={22} height={22} className="h-5 w-5 object-contain" />
              </span>
              <Image src={item.src} alt={tr(item.label.de, item.label.en)} width={96} height={96} className="h-20 w-20 object-contain" />
              <p className="text-xl font-semibold text-slate-900">{tr(item.label.de, item.label.en)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold">
            {tr('Zufriedene Kunden', 'Satisfied customers')}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {tr('Über', 'Over')} <Counter end={1500} /> {tr('Projekte erfolgreich abgeschlossen.', 'projects successfully completed.')}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Exclusivität */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-8 text-center">
            <div className="text-5xl font-bold text-slate-900">
              <Counter start={0} end={1} duration={1000} />
            </div>
            <div className="mt-2 text-sm font-medium uppercase tracking-wide text-slate-500">
              {tr('Exclusivität', 'Exclusivity')}
            </div>
          </div>

          {/* Ranking Top */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-8 text-center">
            <div className="text-5xl font-bold text-slate-900">
              <Counter start={1} end={10} duration={1500} />
            </div>
            <div className="mt-2 text-sm font-medium uppercase tracking-wide text-slate-500">
              {tr('Ranking Top', 'Top ranking')}
            </div>
          </div>

          {/* Klienten */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-8 text-center">
            <div className="text-5xl font-bold text-slate-900">
              <Counter start={0} end={233} duration={2000} />
            </div>
            <div className="mt-2 text-sm font-medium uppercase tracking-wide text-slate-500">
              {tr('Klienten', 'Clients')}
            </div>
          </div>

          {/* Siegel vergaben */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-8 text-center">
            <div className="text-5xl font-bold text-slate-900">
              <Counter start={47} end={477} duration={2500} />
            </div>
            <div className="mt-2 text-sm font-medium uppercase tracking-wide text-slate-500">
              {tr('Siegel vergaben', 'Seals awarded')}
            </div>
          </div>
        </div>
      </section>

      {/* Pakete section using PackageCard */}
      <section id="pakete" className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:w-1/2 flex justify-center">
            <Image
              src="/lampen.png"
              alt="Lampe"
              width={700}
              height={440}
              className="rounded-xl object-cover shadow-lg max-w-full"
              priority
            />
          </div>
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-start">
  {/* WRAPPER DIV ADDED to protect text from flexbox shrinking */}
  <div className="w-full lg:w-1/2 flex justify-center lg:justify-start">
  <h2 
  data-animate="card" // 1. This triggers the scroll animation
  style={{ 
    // 2. Fluid Size (~30% smaller than max)
    fontSize: 'clamp(1.8rem, 3.5vw, 4.5rem)', 
    
    // 3. SaaS Typography
    fontWeight: '800',           
    letterSpacing: '-0.04em',    
    lineHeight: '1',             
    color: '#0f172a',            
    whiteSpace: 'nowrap',        
    fontFamily: 'Inter, system-ui, sans-serif' 
  }} 
  className="drop-shadow-sm transition-all duration-700" // Optional: ensures smooth motion
>
  {tr('Mach dich sichtbar', 'Make yourself visible')}
</h2>
</div>
</div>
        </div>
      </section>

      {/* Prüfverfahren and FAQ */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8">
          <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg">
            <h2 className="text-2xl font-semibold">{tr('Unser Prüfverfahren', 'Our testing procedure')}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {verfahrenHighlights.map((item, i) => (
                <div key={item.label.de} data-animate="card" style={stagger(i)} className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 p-4 text-center">
                  <Image src={item.src} alt={tr(item.label.de, item.label.en)} width={48} height={48} className="h-12 w-12" />
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">{tr(item.label.de, item.label.en)}</p>
                </div>
              ))}
            </div>
            <Link
              href="#pruefverfahren-pdf"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg transition hover:bg-black"
            >
              {tr('Zum Prüfverfahren', 'View procedure')}
            </Link>
          </div>
        </div>

        <div
          id="pruefverfahren-pdf"
          className="mt-12 grid gap-8 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg"
        >
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">
              {tr('VERTRAUEN DURCH PRÜFUNG: Die Testsieger-Check-System Kriterien', 'TRUST THROUGH TESTING: The Testsieger-Check system criteria')}
            </h3>
            <p className="text-sm text-slate-700">
              {tr(
                'Dieses Dokument beschreibt das einheitliche und nachvollziehbare Prüfsystem mit den TCPZ-Prüfkriterien der Prüfsiegel Zentrum UG. Grundlage ist ein standardisiertes Bewertungsverfahren, das sicherstellt, dass alle geprüften Produkte nach denselben objektiven Maßstäben bewertet werden. Die Bewertung erfolgt über ein numerisches System von 1 bis 10 Punkten (Halbpunkte möglich), sodass eine präzise und faire Beurteilung möglich ist. Die Bewertung umfasst folgende Hauptkategorien, um ein ganzheitliches und objektives Ergebnis sicherzustellen:',
                'This document describes the consistent and traceable testing system with the TCPZ criteria of Prüfsiegel Zentrum UG. It is based on a standardized evaluation method to ensure all tested products are rated by the same objective standards. Scoring is on a numeric scale from 1 to 10 (half-points allowed) for precise, fair assessment. The evaluation covers the following main categories to ensure a holistic and objective result:'
              )}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <blockquote className="flex h-full flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-900 shadow-sm">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">
                {tr('Kriterium A: Verpackung', 'Criterion A: Packaging')}
              </span>
              <p className="text-sm text-slate-700">
                {tr(
                  'Wir bewerten die Verpackung auf Schutzfunktion, Materialwahl, Stabilität und Produktsicherheit bei Transport und Lagerung. Zusätzlich prüfen wir Kennzeichnungen und Nachhaltigkeit.',
                  'We assess packaging for protection, material choice, stability, and product safety during transport and storage. We also review labeling and sustainability.'
                )}
              </p>
            </blockquote>
            <blockquote className="flex h-full flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-900 shadow-sm">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">
                {tr('Kriterium B: Verarbeitung und Erscheinungsbild', 'Criterion B: Workmanship and appearance')}
              </span>
              <p className="text-sm text-slate-700">
                {tr(
                  'Bewertung der Materialqualität, Präzision der Verarbeitung, Stabilität sowie des gesamten optischen Eindrucks und Erscheinungsbilds des Produkts.',
                  'Assessing material quality, precision of workmanship, stability, and the overall visual impression of the product.'
                )}
              </p>
            </blockquote>
            <blockquote className="flex h-full flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-900 shadow-sm">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">
                {tr('Kriterium C: Praxistest – Hält der Hersteller seine Werbeversprechen?', 'Criterion C: Practical test – does the manufacturer deliver on promises?')}
              </span>
              <p className="text-sm text-slate-700">
                {tr(
                  'Im praktischen Einsatz überprüfen wir, ob die beworbenen Features, Leistungsversprechen und Produktvorteile tatsächlich eingehalten werden.',
                  'In practical use we verify whether the advertised features, performance promises, and product benefits are truly met.'
                )}
              </p>
            </blockquote>
            <blockquote className="flex h-full flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-900 shadow-sm">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">
                {tr('Kriterium D: Preis-/Leistungsverhältnis und Verbraucherbewertungen', 'Criterion D: Price-performance and consumer reviews')}
              </span>
              <p className="text-sm text-slate-700">
                {tr(
                  'Das Verhältnis von Preis zu tatsächlicher Leistung wird analysiert und um reale Nutzermeinungen ergänzt. Dadurch entsteht ein ausgewogenes Gesamtbild aus objektiven Tests und Praxiserfahrungen.',
                  'We analyze the price-to-performance ratio and complement it with real user opinions. This creates a balanced overall picture from objective tests and practical experiences.'
                )}
              </p>
            </blockquote>
          </div>

          <p className="text-sm font-semibold text-slate-800">
            {tr(
              'Alle Kriterien werden mit 1 bis 10 Punkten bewertet. Der Durchschnitt dieser Kriterien ergibt die Gesamtnote und dient als Grundlage für die Auszeichnung im Testsieger-Check.',
              'All criteria are scored from 1 to 10. The average of these criteria forms the overall grade and is the basis for the Testsieger-Check award.'
            )}
          </p>
          <p className="text-sm font-semibold text-slate-800">
            {tr(
              'Hinweis: Zertifikat und Siegel werden nur bis zu einem Testergebnis von 85% ausgestellt.',
              'Note: Certificate and seal are issued only up to a test result of 85%.'
            )}
          </p>

          <div className="flex justify-start">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <a
                href="https://drive.google.com/open?id=14xhZ55uU5_bGZWxH9jKca0Mp-CEaGbDi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg transition hover:bg-black"
              >
                {tr('Mehr Details Hier (PDF)', 'More details here (PDF)')}
              </a>
              <span className="text-sm text-slate-700">
                
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-white pt-8">
          <h3 className="text-2xl font-semibold">{tr('Häufige Fragen', 'Frequently asked questions')}</h3>
          <div className="mt-6 space-y-6">
            {phasesQa.qa.map((item, i) => (
              <div key={item.question.de} data-animate="card" style={stagger(i)} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h4 className="text-lg font-semibold text-slate-900">{tr(item.question.de, item.question.en)}</h4>
                <p className="mt-2 text-sm text-slate-600">{tr(item.answer.de, item.answer.en)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
