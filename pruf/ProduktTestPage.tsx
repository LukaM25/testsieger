  "use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PackageCard } from "@/components/PackageCard";
import PrecheckPage from "@/app/precheck/page";

const steps = [
  { src: "/images/ablauf/1free.PNG", label: "Kostenloser PRE-CHECK" },
  { src: "/images/ablauf/2lizenz.PNG", label: "Lizenzplan auswählen" },
  { src: "/images/ablauf/3liefer.PNG", label: "Produkt an uns senden" },
  { src: "/images/ablauf/4testergebnis.PNG", label: "Testergebnis & Siegel erhalten" },
];

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
  useEffect(() => {
    if (typeof window === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => { 
          if (entry.isIntersecting) {
            entry.target.classList.remove("opacity-0", "translate-y-6");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );

    document.querySelectorAll<HTMLElement>("[data-animate]").forEach((el) => {
      el.classList.add("opacity-0", "translate-y-6");
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const [packageLoading, setPackageLoading] = useState<string | null>(null);
  const [showPrecheck, setShowPrecheck] = useState(false);

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
            <Image src="/images/iconen/logoTC.png" alt="Logo" width={64} height={64} className="h-16 w-16" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Testsieger Check</p>
              <h1 className="text-4xl font-bold leading-tight">Testsieger Check T</h1>
              <p className="text-sm font-semibold tracking-[0.4em] text-slate-400">VERTRAUEN DURCH PRÜFUNG</p>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Wir begleiten Sie vom Pre-Check bis zum Siegel – transparent, digital und mit einem klaren Bewertungsrahmen.
          </p>
        </div>
        <div className="relative flex w-full max-w-lg items-center justify-end">
          <div className="flex items-center gap-12 p-6">
            {/* left: small spacer to ensure 50px gap from h1 in the left column; 50px ~= 12.5rem/4 = 12.5 -> use arbitrary spacing */}
            <div className="w-[50px] hidden sm:block" aria-hidden />
            <div className="flex flex-col items-center">
              <Image src="/tclogo.png" alt="TC Logo" width={420} height={110} className="mb-4 h-[110px] w-[220px] object-contain" />
            </div>
            <div className="p-6 shadow-[0_20px_60px_rgba(15,23,42,0.2)]">
              <Image src="/siegel.png" alt="Testsieger Siegel" width={176} height={176} className="h-40 w-40 object-contain" />
            </div>
          </div>
        </div>
      </section>

      <section data-animate className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold">Ablauf</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-4">
          {steps.map((item) => (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="flex justify-center">
                <Image src={item.src} alt={item.label} width={96} height={96} className="h-20 w-20 object-contain" />
              </div>
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">{item.label}</p>
            </div>
          ))}
        </div>
      </section>
      {/* Inserted Pre-Check form inline so the Produkt Test page is self-contained */}
      <section id="precheck" className="mx-auto max-w-3xl px-4 py-10">
        <div
          className="flex items-center justify-between cursor-pointer rounded-full bg-indigo-900 px-4 py-3 text-black"
          role="button"
          tabIndex={0}
          onClick={() => setShowPrecheck((s) => !s)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowPrecheck((s) => !s); }}
        >
          <Link
            href="/precheck"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center text-2xl font-semibold text-black"
            aria-label="Kostenloser Pre-Check (0 €) - Zur Precheck Seite"
          >
            Kostenloser Pre-Check (0 €)
          </Link>
          <div className="inline-flex items-center gap-3">
            <span className="text-sm font-semibold">Kostenlos Pre-Check</span>
            <svg
              className={`h-5 w-5 transform transition-transform duration-200 ${showPrecheck ? 'rotate-180' : 'rotate-0'}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className={`mt-6 overflow-hidden transition-all ${showPrecheck ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          {showPrecheck && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-slate-900">
              <PrecheckPage />
            </div>
          )}
        </div>
      </section>

      {/* Vorteile / Highlights */}
      <section data-animate className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Dein Vorteil</h2>
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">klar & strukturiert</span>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {advantanges.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <Image src={item.src} alt={item.label} width={64} height={64} className="h-14 w-14" />
              <p className="text-lg font-semibold text-slate-900">{item.label}</p>
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
          <PackageCard title="Basic" price="254€ + 0,99€/Tag" subtitle="DE, 1 Kanal" onSelect={() => choosePackage('BASIC')} />
          <PackageCard title="Premium" price="254€ + 1,54€/Tag" subtitle="EU, alle Kanäle" onSelect={() => choosePackage('PREMIUM')} />
          <PackageCard title="Lifetime" price="1477€" subtitle="EU, alle Kanäle, LT-Lizenz" onSelect={() => choosePackage('LIFETIME')} />
        </div>
      </section>

      {/* Prüfverfahren and FAQ */}
      <section data-animate className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr,0.9fr]">
          <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg">
            <h2 className="text-2xl font-semibold">Unser Prüfverfahren</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {verfahrenHighlights.map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 p-4 text-center">
                  <Image src={item.src} alt={item.label} width={48} height={48} className="h-12 w-12" />
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">{item.label}</p>
                </div>
              ))}
            </div>
            <Link
              href="#pruefverfahren-pdf"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg transition hover:bg-black"
            >
              Zum Prüfverfahren (PDF)
            </Link>
          </div>
          <div className="flex items-center justify-center">
            <Image src="/images/siegel21.png" alt="Siegel" width={260} height={260} className="h-60 w-auto" />
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200 bg-white pt-8">
          <h3 className="text-2xl font-semibold">Häufige Fragen</h3>
          <div className="mt-6 space-y-6">
            {phasesQa.qa.map((item) => (
              <div key={item.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
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
