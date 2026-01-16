"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { stagger } from "@/lib/animation";
import PrecheckForm from "@/components/precheck/PrecheckForm";
import Counter from "@/components/Counter";
import { useLocale } from "@/components/LocaleProvider";

type StepCard = {
  src: string;
  label: { de: string; en: string };
};

type Plan = {
  name: string;
  theme: "sky" | "indigo" | "midnight";
  usage: { de: string[]; en: string[] };
  contents: { de: string[]; en: string[] };
  basePriceEur: number;
  billing: "daily" | "one-time";
  footer: { de: string[]; en: string[] };
};

const steps: StepCard[] = [
  { src: "/images/ablauf/1free.PNG", label: { de: "Kostenloser Pre-Check", en: "Free pre-check" } },
  { src: "/images/ablauf/3liefer.PNG", label: { de: "Produkt an uns senden", en: "Send product to us" } },
  { src: "/images/ablauf/2lizenz.PNG", label: { de: "Lizenzplan auswählen", en: "Choose license plan" } },
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

const STANDARD_NET_EUR = 229;

const plans: Plan[] = [
  {
    name: "Basic",
    theme: "sky",
    usage: {
      de: ["1 Verkaufskanal (Amazon, Otto...)", "Sprache: Deutsch"],
      en: ["1 sales channel (Amazon, Otto...)", "Language: German"],
    },
    contents: {
      de: ["Siegel", "Zertifikat", "Prüfbericht"],
      en: ["Seal", "Certificate", "Test report"],
    },
    basePriceEur: 0.99,
    billing: "daily",
    footer: {
      de: ["Abrechnung 365 Tage / Jahr", "Lizenzverlängerung jährlich."],
      en: ["Billing 365 days / year", "License renewal yearly."],
    },
  },
  {
    name: "Premium",
    theme: "indigo",
    usage: {
      de: ["ALLE Verkaufskanäle", "ALLE Sprachen"],
      en: ["ALL sales channels", "ALL languages"],
    },
    contents: {
      de: ["Siegel", "Zertifikat", "Prüfbericht"],
      en: ["Seal", "Certificate", "Test report"],
    },
    basePriceEur: 1.47,
    billing: "daily",
    footer: {
      de: ["Abrechnung 365 Tage / Jahr", "Lizenzverlängerung jährlich."],
      en: ["Billing 365 days / year", "License renewal yearly."],
    },
  },
  {
    name: "Lifetime",
    theme: "midnight",
    usage: {
      de: ["ALLE Verkaufskanäle", "ALLE Sprachen"],
      en: ["ALL sales channels", "ALL languages"],
    },
    contents: {
      de: ["Siegel", "Zertifikat", "Prüfbericht"],
      en: ["Seal", "Certificate", "Test report"],
    },
    basePriceEur: 1466,
    billing: "one-time",
    footer: {
      de: ["Abrechnung 365 Tage / Jahr", "Lizenzverlängerung jährlich."],
      en: ["Billing 365 days / year", "License renewal yearly."],
    },
  },
];

const planThemes = {
  sky: {
    card: "bg-gradient-to-b from-sky-300 via-sky-200 to-sky-50",
    border: "border-sky-200/70",
    label: "text-slate-900",
    body: "text-slate-800",
    muted: "text-slate-700/80",
  },
  indigo: {
    card: "bg-gradient-to-b from-indigo-500 via-indigo-700 to-slate-950",
    border: "border-indigo-400/30",
    label: "text-white",
    body: "text-white/90",
    muted: "text-white/70",
  },
  midnight: {
    card: "bg-gradient-to-b from-blue-950 via-slate-950 to-black",
    border: "border-blue-500/20",
    label: "text-white",
    body: "text-white/90",
    muted: "text-white/70",
  },
} as const;

// Add cache-busting query params so updated public images show without hard refresh
const carouselImages = ['/carosel/wertung1.jpeg', '/carosel/wertung2.jpeg'];

// Reuse the full precheck page component here to keep validation and behavior consistent

const phasesQa = {
  qa: [
    {
      question: { de: 'Was genau wird geprüft?', en: 'What exactly is tested?' },
      answer: {
        de: 'Wir prüfen Konsumprodukte anhand klar definierter, transparenter Prüfkriterien nach DPI-Standard.\nJe nach Produktkategorie bewerten wir u. a. Verarbeitung, Funktion, Sicherheit, Praxistauglichkeit und Dokumentation. Die Prüfung erfolgt nachvollziehbar und wird schriftlich dokumentiert.',
        en: 'We test consumer products against clearly defined, transparent criteria (DPI standard).\nDepending on the product category, we assess workmanship, function, safety, real-world usability, and documentation. The process is traceable and documented in writing.',
      }, 
    },
    {
      question: { de: 'Warum gibt es eine jährliche Lizenz?', en: 'Why is there an annual license?' },
      answer: {
        de: 'Qualität ist kein einmaliger Zustand. Die Jahreslizenz stellt sicher, dass:\n• das Produkt weiterhin unverändert ist,\n• das Siegel aktuell bleibt,\n• Missbrauch ausgeschlossen wird.\nOhne aktive Lizenz erlischt das Nutzungsrecht am Siegel.',
        en: 'Quality is not a one-time event. The annual license ensures that:\n• the product remains unchanged,\n• the seal stays current,\n• misuse is prevented.\nWithout an active license, the right to use the seal expires.',
      },
    },
    {
      question: { de: 'Wie lange dauert die Prüfung?', en: 'How long does the test take?' },
      answer: {
        de: 'Nach Eingang des Produkts planen wir für den vollständigen Produkttest inklusive Prüfbericht und Zertifikat 14–21 Tage ein.\nMit unserem Prioritäts-Service kann die Bearbeitungszeit auf 7 Tage reduziert werden.',
        en: 'After the product arrives, we plan 14–21 days for the full product test including report and certificate.\nWith our priority service, turnaround can be reduced to 7 days.',
      },
    },
    {
      question: { de: 'Was passiert, wenn ich die Lizenz kündige?', en: 'What happens if I cancel the license?' },
      answer: {
        de: 'Nach Kündigung und Ende des Gültigkeitszeitraums:\n• erlischt das Nutzungsrecht am Siegel,\n• muss das Siegel aus allen Kanälen entfernt werden,\n• darf nicht weiter mit der Auszeichnung geworben werden.',
        en: 'After cancellation and the end of the validity period:\n• the right to use the seal expires,\n• the seal must be removed from all channels,\n• advertising with the award is no longer permitted.',
      },
    },
    {
      question: { de: 'Was passiert, wenn mein Produkt die Prüfung nicht besteht?', en: 'What if my product does not pass?' },
      answer: {
        de: 'Sie erhalten eine klare, sachliche Rückmeldung, welche Punkte nicht erfüllt wurden. Sie können Ihr Produkt anpassen und erneut kostenlos zur Prüfung einreichen.\nEin Siegel wird erst nach bestandener Prüfung vergeben. Die Lizenzgebühren werden erst nach bestandener Prüfung fällig – vorab ist lediglich die Gebühr für den Prüfaufwand zu entrichten.',
        en: 'You receive clear, factual feedback on which criteria were not met. You can improve your product and resubmit it for testing free of charge.\nA seal is awarded only after passing. License fees are due only after a successful test; upfront, only the testing effort fee applies.',
      },
    },
    {
      question: { de: 'Was erhalte ich nach bestandener Prüfung?', en: 'What do I receive after passing?' },
      answer: {
        de: 'Nach bestandener Prüfung erhalten Sie direkt das Testergebnis und können den passenden Lizenzplan auswählen.\nSie erhalten einen detaillierten Prüfbericht (vollständig für Ihre Unterlagen), zusätzlich wird das Ergebnis unter der zugeordneten Produktkategorie beim Deutschen Prüfsiegel Institut veröffentlicht.\nDarüber hinaus erhalten Sie ein Zertifikat (abrufbar via QR-Code auf dem Siegel) sowie das Siegel als PNG-Datei zur vereinbarten Nutzung auf Verpackung, Website oder Marketingmaterialien.',
        en: 'After passing, you receive the test result immediately and can choose the appropriate license plan.\nYou get a detailed test report for your records; additionally, the result is published under the assigned product category at the Deutsches Prüfsiegel Institut.\nYou also receive a certificate (accessible via the QR code on the seal) and the seal as a PNG file for the agreed use on packaging, website, or marketing materials.',
      },
    },
    {
      question: { de: 'Welche Kosten entstehen – und wann?', en: 'What costs arise — and when?' },
      answer: {
        de: 'Nach dem kostenlosen bestandenen Pre-Check kann das Produkt an uns geschickt werden.\nFür den Prüfungsaufwand, das Erstellen der Zertifikate und Berichte wird eine Grundgebühr von 229 € erhoben.\nNach Abschluss der Prüfung und dem vorliegenden Testergebnis kann der Lizenzplan gewählt werden.\nDer Lizenzplan ist individuell auszuwählen und wird für ein komplettes Jahr bezahlt. Ist das Ergebnis nicht zufriedenstellend, muss kein Lizenzplan ausgewählt werden – somit wird auch kein Siegel und Zertifikat ausgestellt.',
        en: 'After the free pre-check is passed, the product can be sent to us.\nA base fee of €229 is charged for the testing effort and the creation of certificates and reports.\nAfter the test is completed and the result is available, you can choose a license plan.\nThe license plan is selected individually and paid for a full year.\nIf the result is not satisfactory, no license plan is required — therefore no seal or certificate is issued.',
      },
    },
    {
      question: {
        de: 'Mehrere Produkte sollen getestet werden, ändert sich der Preis?',
        en: 'If multiple products are tested, does the price change?',
      },
      answer: {
        de: 'Bei einer Anzahl ab 5 Produkten, die getestet werden sollen, können Sie uns direkt anschreiben und wir bereiten Ihnen ein individuelles Angebot.',
        en: 'If you want to test 5 or more products, please contact us directly and we will prepare a tailored offer.',
      },
    },
  ],
};

export default function ProduktTestPage() {
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const tr = (de: string, en: string) => (locale === 'en' ? en : de);
  const [showPrecheck, setShowPrecheck] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const precheckSectionRef = useRef<HTMLElement | null>(null);
  const previewRef = useRef<HTMLElement | null>(null);
  const procedureTopRef = useRef<HTMLDivElement | null>(null);
  const procedureDetailRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasPlayedVideoRef = useRef(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [contentMaxHeight, setContentMaxHeight] = useState<string>('0px');
  const [heroAnim, setHeroAnim] = useState(false);
  const formatEur = (amountEur: number) =>
    new Intl.NumberFormat(locale === "en" ? "en-GB" : "de-DE", { style: "currency", currency: "EUR" }).format(amountEur);
  const roundEur = (n: number) => Math.round(n * 100) / 100;
  const baseNetPerProduct = STANDARD_NET_EUR;
  const savingsTiers = [
    { count: 1, discountPercent: 0 },
    { count: 2, discountPercent: 20 },
    { count: 3, discountPercent: 30 },
  ].map((tier) => {
    const totalNet = roundEur(baseNetPerProduct * tier.count);
    const finalNet = roundEur(totalNet * (1 - tier.discountPercent / 100));
    return { ...tier, totalNet, finalNet };
  });
  const productCountLabel = (count: number) =>
    tr(`${count} Produkt${count === 1 ? "" : "e"}`, `${count} product${count === 1 ? "" : "s"}`);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  const [isCoarsePointer, setIsCoarsePointer] = useState(
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(pointer: coarse)').matches
      : false
  );
  const [ctaNotice, setCtaNotice] = useState<string | null>(null);

  // update max-height when showPrecheck toggles to enable smooth height transition
  useEffect(() => {
    if (!contentRef.current) return;
    if (isCoarsePointer) {
      // avoid height animations on touch devices to reduce layout churn that can close mobile keyboards
      setContentMaxHeight(showPrecheck ? 'none' : '0px');
      return;
    }
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
  }, [showPrecheck, isCoarsePointer]);

  useEffect(() => {
    // trigger hero image entrance animation on mount
    const t = setTimeout(() => setHeroAnim(true), 60);
    return () => clearTimeout(t);
  }, []);

  // If deep-linked to precheck, open the accordion and scroll into view
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const shouldOpen = searchParams?.get('precheck') === 'open' || window.location.hash === '#precheck';
    if (!shouldOpen) return;
    setShowPrecheck(true);
    if (prefersReducedMotion) return;
    // allow layout to settle before scrolling for smoother positioning; slightly slower for a calmer feel
    const t = setTimeout(() => {
      precheckSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 450);
    return () => clearTimeout(t);
  }, [searchParams, prefersReducedMotion]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const coarseQuery = window.matchMedia('(pointer: coarse)');
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsCoarsePointer(coarseQuery.matches);
    setPrefersReducedMotion(reduceMotionQuery.matches);
    const handleCoarse = (e: MediaQueryListEvent) => setIsCoarsePointer(e.matches);
    const handleReduce = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    if (coarseQuery.addEventListener) {
      coarseQuery.addEventListener('change', handleCoarse);
    } else if (coarseQuery.addListener) {
      coarseQuery.addListener(handleCoarse);
    }
    if (reduceMotionQuery.addEventListener) {
      reduceMotionQuery.addEventListener('change', handleReduce);
    } else if (reduceMotionQuery.addListener) {
      reduceMotionQuery.addListener(handleReduce);
    }
    return () => {
      if (coarseQuery.removeEventListener) {
        coarseQuery.removeEventListener('change', handleCoarse);
      } else if (coarseQuery.removeListener) {
        coarseQuery.removeListener(handleCoarse);
      }
      if (reduceMotionQuery.removeEventListener) {
        reduceMotionQuery.removeEventListener('change', handleReduce);
      } else if (reduceMotionQuery.removeListener) {
        reduceMotionQuery.removeListener(handleReduce);
      }
    };
  }, []);

  const scrollToPrecheck = () => {
    precheckSectionRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  };
  const scrollToProcedure = () => {
    procedureTopRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const goPrevSlide = () => {
    setCarouselIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const goNextSlide = () => {
    setCarouselIndex((prev) => (prev + 1) % carouselImages.length);
  };

  const scrollToPreview = () => {
    previewRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
  };

  const handlePrecheckCta = async (e: React.MouseEvent) => {
    e.preventDefault();
    setCtaNotice(null);
    try {
      const res = await fetch('/api/precheck/status', { method: 'GET' });
      if (res.ok) {
        window.location.href = '/precheck';
        return;
      }
    } catch {
      // ignore and fall back to opening form
    }
    setCtaNotice(tr('Bitte Konto erstellen und Produkt für den Pre-Check einreichen.', 'Please create an account and submit your product for the pre-check.'));
    setShowPrecheck(true);
    // ensure height animation opens
    requestAnimationFrame(() => {
      scrollToPrecheck();
    });
  };

  useEffect(() => {
    // Pause carousel rotations when touch, reduced motion, or the precheck form is open to avoid layout churn that can blur inputs.
    if (isCoarsePointer || prefersReducedMotion || showPrecheck) return;
    const id = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselImages.length);
    }, 3200);
    return () => clearInterval(id);
  }, [isCoarsePointer, prefersReducedMotion, showPrecheck]);

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const openParam = searchParams?.get('section');
    const shouldOpen = hash === '#unser-pruefverfahren' || hash === '#pruefverfahren-pdf' || openParam === 'procedure';

    if (shouldOpen) {
      requestAnimationFrame(() => {
        scrollToProcedure();
        if (procedureDetailRef.current) {
          procedureDetailRef.current.classList.add('ring-2', 'ring-[#134074]', 'shadow-2xl', 'transition', 'duration-500');
          setTimeout(() => {
            procedureDetailRef.current?.classList.remove('ring-2', 'ring-[#134074]', 'shadow-2xl', 'transition', 'duration-500');
          }, 1800);
        }
      });
    }
  }, [searchParams, prefersReducedMotion]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    videoEl.muted = true;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasPlayedVideoRef.current) {
          videoEl.play().catch(() => {});
          hasPlayedVideoRef.current = true;
          observer.disconnect();
        }
      },
      { threshold: 0.45 }
    );

    observer.observe(videoEl);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="bg-white text-slate-900">
      <section className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 sm:flex-row sm:items-center sm:justify-between lg:py-20">
  <div className="space-y-6 max-w-xl">
          <div className="flex items-center gap-4">
            <div>
              <p data-animate="hero-badge" className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500"></p>
              <Image src="/tclogo.png" alt="TC Logo" width={525} height={138} className="mb-4 h-[138px] w-[275px] object-contain" />
            </div>
          </div>
          <div className="flex items-end gap-4">
            <Image
              src="/images/iconen/destripe.jpeg"
              alt="Deutschlandfarben"
              width={12}
              height={64}
              className="h-20 w-auto object-contain self-end"
              priority
            />
            <div className="space-y-3">
              <h1 data-animate="hero-title" className="text-3xl font-bold">
                {tr('Ihr Produkt verdient Vertrauen', 'Your product deserves trust')}
              </h1>
              <p data-animate="hero-text" className="text-sm text-slate-600">
                {tr(
                  'Wir begleiten Sie vom Pre-Check bis zum Siegel – transparent, digital und mit einem klaren Bewertungsrahmen.',
                  'We support you from pre-check to seal – transparent, digital, and with a clear evaluation framework.'
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              data-animate="hero-cta"
              onClick={handlePrecheckCta}
              className="inline-flex mt-3 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
            >
              {tr('Zum Pre-Check', 'To pre-check')}
            </button>
            <button
              onClick={scrollToPreview}
              className="inline-flex mt-3 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
            >
              {tr('Produkt Vorschau', 'Product preview')}
            </button>
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
                src="/siegel19.png"
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
      <section id="precheck" ref={precheckSectionRef} className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex flex-col items-center gap-4 text-slate-900">
          <button
            type="button"
            onClick={() => setShowPrecheck((s) => !s)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowPrecheck((s) => !s); }}
            className="relative flex w-full flex-col items-center gap-2 rounded-full px-14 py-6 text-center text-white shadow-[0_18px_40px_-16px_rgba(30,96,145,0.5),0_10px_20px_-12px_rgba(11,37,69,0.35)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-14px_rgba(30,96,145,0.5),0_12px_24px_-12px_rgba(11,37,69,0.35)] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1E6091] bg-[linear-gradient(135deg,_#1E6091,_#134074)]"
            style={{ background: 'linear-gradient(135deg, #1E6091, #134074)' }}
            aria-expanded={showPrecheck}
            aria-controls="precheck-content"
          >
            <span className="text-2xl font-semibold tracking-[0.18em]">
              {tr('Kostenloser Pre-Check', 'Free pre-check')}
            </span>
            <span className="text-sm font-semibold uppercase tracking-[0.28em] text-white/90 inline-flex items-center justify-center gap-2">
              {tr('(Dauert nur 3 Minuten)', '(Takes only 3 minutes)')}
              <svg
                aria-hidden="true"
                className="h-6 w-6 text-white/90"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a6.75 6.75 0 1 0 6.75 6.75" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.5v5.25l3 1.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 2.75h5M10.75 3.5l-.5 2.25M13.25 3.5l.5 2.25" />
              </svg>
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
          {ctaNotice && <p className="text-sm font-semibold text-emerald-900 text-center px-4">{ctaNotice}</p>}
        </div>

        <div
          className="mt-6 overflow-hidden transition-all duration-300 ease-in-out"
          // if contentMaxHeight is 'none' we don't set maxHeight style so it can grow naturally
          style={{ maxHeight: contentMaxHeight === 'none' ? undefined : contentMaxHeight, opacity: showPrecheck ? 1 : 0 }}
          aria-hidden={!showPrecheck}
        >
          <div ref={contentRef} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-slate-900">
            <PrecheckForm />
          </div>
        </div>
      </section>

      {/* Vorteile / Highlights */}
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-6">
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
                <Image src="/checkmark.png" alt="Check" width={24} height={24} className="h-6 w-6 object-contain" />
              </span>
              <Image src={item.src} alt={tr(item.label.de, item.label.en)} width={96} height={96} className="h-20 w-20 object-contain" />
              <p className="text-xl font-semibold text-slate-900">{tr(item.label.de, item.label.en)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="space-y-6 text-left">
              <h2 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-6xl">
                <span>{tr('Spare mehrere Hundert Euro Werbebudget ein.', 'Save hundreds of euros in marketing budget.')}</span>
                <span className="ml-3 inline-flex align-middle sm:ml-4">
                  <Image
                    src="/checkmark.png"
                    alt={tr('Checkmark', 'Checkmark')}
                    width={60}
                    height={60}
                    className="h-10 w-10 object-contain sm:h-[3rem] sm:w-[3rem]"
                  />
                </span>
              </h2>
              <p className="text-3xl font-medium text-slate-900 sm:text-[2.35rem]">
                {tr('Verbrenne nicht unnötig Werbebudget', "Don't burn marketing budget unnecessarily")}
              </p>
            </div>
            <div className="flex h-full items-center justify-center md:justify-end">
              <img
                src="/cashdrop.jpeg"
                alt={tr('Cash drop', 'Cash drop')}
                className="h-full w-full max-w-[421px] object-contain sm:max-w-[518px]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-6 pb-6">
        <div className="text-center">
          <h2 className="text-4xl font-bold">
            {tr('Zufriedene Kunden', 'Satisfied customers')}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {tr('Über', 'Over')} <Counter end={1500} /> {tr('Projekte erfolgreich abgeschlossen.', 'projects successfully completed.')}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-6 pb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Exclusivität */}
          <div
            className="flex flex-col items-center justify-center rounded-2xl bg-white p-8 text-center text-slate-900"
          >
            <div className="text-5xl font-bold">
              <Counter start={0} end={1} duration={1875} />
            </div>
            <div className="mt-2 text-sm font-medium uppercase tracking-wide">
              {tr('Exclusivität', 'Exclusivity')}
            </div>
          </div>

          {/* Ranking Top */}
          <div
            className="flex flex-col items-center justify-center rounded-2xl bg-white p-8 text-center text-slate-900"
          >
            <div className="text-5xl font-bold">
              <Counter start={1} end={10} duration={2813} />
            </div>
            <div className="mt-2 text-sm font-medium uppercase tracking-wide">
              {tr('Ranking Top', 'Top ranking')}
            </div>
          </div>

          {/* Klienten */}
          <div
            className="flex flex-col items-center justify-center rounded-2xl bg-white p-8 text-center text-slate-900"
          >
            <div className="text-5xl font-bold">
              <Counter start={0} end={233} duration={3750} />
            </div>
            <div className="mt-2 text-sm font-medium uppercase tracking-wide">
              {tr('Klienten', 'Clients')}
            </div>
          </div>

          {/* Siegel vergaben */}
          <div
            className="flex flex-col items-center justify-center rounded-2xl bg-white p-8 text-center text-slate-900"
          >
            <div className="text-5xl font-bold">
              <Counter start={47} end={477} duration={4688} />
            </div>
            <div className="mt-2 text-sm font-medium uppercase tracking-wide">
              {tr('Siegel vergaben', 'Seals awarded')}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-16">
        <div className="space-y-12">
          <div className="rounded-3xl border border-slate-100 bg-white/90 p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.25)] md:p-10">
            <div className="space-y-3 text-center">
              <h3 className="text-3xl md:text-4xl font-semibold text-slate-900">
                {tr("Weitere Produkte hinzufügen und sparen.", "Add more products and save.")}
              </h3>
              <p className="text-lg md:text-xl text-slate-600">
                {tr("Für die Prüfung fällt eine einmalige Testgebühr an.", "A one-time test fee applies for the review.")}
              </p>
            </div>
            <div className="mt-8 space-y-5">
              {savingsTiers.map((tier) => (
                <div key={tier.count} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <span className="text-lg font-medium text-slate-900">{productCountLabel(tier.count)}</span>
                  <div
                    className="inline-flex flex-wrap items-center gap-3 rounded-full px-6 py-2.5 text-white shadow-md ring-1 ring-blue-200/30"
                    style={{ backgroundImage: "linear-gradient(90deg, #1d4ed8 0%, #1e3a8a 55%, #0f172a 100%)" }}
                  >
                    {tier.discountPercent > 0 && (
                      <>
                        <span className="text-sm md:text-base text-white/70 line-through">{formatEur(tier.totalNet)}</span>
                        <span className="text-sm md:text-base text-white/70">- {tier.discountPercent}%</span>
                      </>
                    )}
                    <span className="text-base md:text-lg font-semibold">
                      {tr("Testgebühr", "Test fee")} {formatEur(tier.finalNet)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm md:text-base text-slate-600 max-w-2xl">
                {tr(
                  "Bei mehr als 3 Produkten, schreiben Sie uns direkt an und wir unterbreiten Ihnen ein Angebot.",
                  "For more than 3 products, contact us directly and we will make you an offer."
                )}
              </p>
              <Link
                href="/kontakt"
                className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
              >
                {tr("Angebot anfordern", "Request an offer")}
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <div className="text-2xl font-semibold text-slate-900 text-center">{tr("Lizenzpläne", "License plans")}</div>
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan) => {
                const theme = planThemes[plan.theme];
                const usageLines = locale === "en" ? plan.usage.en : plan.usage.de;
                const contentLines = locale === "en" ? plan.contents.en : plan.contents.de;
                const footerLines = locale === "en" ? plan.footer.en : plan.footer.de;
                const priceSuffix = plan.billing === "daily" ? (locale === "en" ? " / day" : " / Tag") : "";
                const priceRows =
                  plan.billing === "daily"
                    ? [
                        {
                          label: `${locale === "en" ? "1 prod." : "1 Prod."}`,
                          price: `${formatEur(roundEur(plan.basePriceEur))}${priceSuffix}`,
                        },
                        {
                          label: `${locale === "en" ? "2 prod." : "2 Prod."} -20%`,
                          price: `${formatEur(roundEur(plan.basePriceEur * 0.8))}${priceSuffix}`,
                        },
                        {
                          label: `${locale === "en" ? "3 prod." : "3 Prod."} -30%`,
                          price: `${formatEur(roundEur(plan.basePriceEur * 0.7))}${priceSuffix}`,
                        },
                      ]
                    : [
                        {
                          label: `${locale === "en" ? "1 prod." : "1 Prod."}`,
                          price: `${formatEur(roundEur(plan.basePriceEur))}`,
                        },
                        {
                          label: `${locale === "en" ? "2 prod." : "2 Prod."} -20%`,
                          price: `${formatEur(roundEur(plan.basePriceEur * 2 * 0.8))}`,
                        },
                        {
                          label: `${locale === "en" ? "3 prod." : "3 Prod."} -30%`,
                          price: `${formatEur(roundEur(plan.basePriceEur * 3 * 0.7))}`,
                        },
                      ];
                return (
                  <div key={plan.name} className="flex h-full flex-col items-center gap-4">
                    <div className="text-lg font-semibold text-slate-900">{plan.name}</div>
                    <div
                      className={`flex h-full w-full flex-col justify-between rounded-[28px] border ${theme.border} ${theme.card} p-6 text-center font-semibold shadow-[0_28px_60px_-40px_rgba(15,23,42,0.65)] transition-transform duration-300 hover:-translate-y-1`}
                    >
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className={`text-[15.4px] font-semibold ${theme.label}`}>{tr("Nutzung:", "Usage:")}</div>
                          <div className={`space-y-1 text-[15.4px] ${theme.body}`}>
                            {usageLines.map((line) => (
                              <div key={line}>{line}</div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className={`text-[15.4px] font-semibold ${theme.label}`}>{tr("Inhalt:", "Contents:")}</div>
                          <div className={`space-y-1 text-[15.4px] ${theme.body}`}>
                            {contentLines.map((line) => (
                              <div key={line}>- {line}</div>
                            ))}
                          </div>
                        </div>
                        <div className={`space-y-1 text-[15.4px] ${theme.body} w-full max-w-[240px] mx-auto`}>
                          {priceRows.map((row) => (
                            <div key={`${row.label}-${row.price}`} className="flex items-center justify-between gap-4 tabular-nums">
                              <span className="text-left">{row.label}</span>
                              <span className="text-right">{row.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className={`mt-6 space-y-1 text-[12.1px] leading-relaxed ${theme.muted}`}>
                        {footerLines.map((line) => (
                          <div key={line}>{line}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Pakete section using PackageCard */}
      <section id="pakete" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="flex justify-center">
            <video
              ref={videoRef}
              src="/kaffe.mp4"
              className="rounded-xl object-cover shadow-lg max-w-full"
              width={700}
              height={440}
              muted
              playsInline
              preload="metadata"
            >
              {tr('Ihr Browser unterstützt das Video-Tag nicht.', 'Your browser does not support the video tag.')}
            </video>
          </div>
          <div className="w-full max-w-xl lg:ml-4 flex justify-center lg:justify-start">
            <h2
              data-animate="card"
              style={{
                fontSize: 'clamp(2.2rem, 3vw, 4rem)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: '1.05',
                color: '#0f172a',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
              className="drop-shadow-sm transition-all duration-700 text-balance"
            >
              {tr('Mach dich sichtbar', 'Make yourself visible')}
            </h2>
          </div>
        </div>
      </section>

      {/* Produkt Vorschau carousel */}
      <section ref={previewRef} className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                {tr('Produkt Vorschau', 'Product preview')}
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">{tr('So sehen geprüfte Produkte aus', 'A look at tested products')}</h2>
              <p className="text-sm text-slate-600">
                {tr('Beispiele aus aktuellen Bewertungen. Swipe oder warten, um weitere zu sehen.', 'Examples from current reviews. Swipe or wait to see more.')}
              </p>
            </div>
            <div className="flex gap-2">
              {carouselImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCarouselIndex(i)}
                  className={`h-2.5 w-2.5 rounded-full transition ${carouselIndex === i ? 'bg-slate-900' : 'bg-slate-300'}`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
          <div className="relative mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <button
              type="button"
              onClick={goPrevSlide}
              aria-label={tr('Vorheriges Bild', 'Previous image')}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-sm ring-1 ring-slate-200 transition hover:bg-white hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
            >
              <span className="block h-4 w-4 rotate-180 border-b-2 border-r-2 border-slate-800" />
            </button>
            <button
              type="button"
              onClick={goNextSlide}
              aria-label={tr('Nächstes Bild', 'Next image')}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-sm ring-1 ring-slate-200 transition hover:bg-white hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
            >
              <span className="block h-4 w-4 border-b-2 border-r-2 border-slate-800" />
            </button>
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
            >
              {carouselImages.map((src, idx) => (
                <div key={src} className="min-w-full flex justify-center items-center bg-slate-50">
                  <Image
                    src={src}
                    alt={tr('Produkt Vorschaubild', 'Product preview image')}
                    width={1400}
                    height={900}
                    className="h-[280px] w-full object-contain sm:h-[340px] md:h-[420px] lg:h-[500px]"
                    priority={idx === 0}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Prüfverfahren and FAQ */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8" id="unser-pruefverfahren" ref={procedureTopRef}>
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
          ref={procedureDetailRef}
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
                href="/verfahrenpdf/pruefkriterium.pdf"
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
              <details
                key={item.question.de}
                data-animate="card"
                style={stagger(i)}
                className="group rounded-2xl border border-slate-200 bg-slate-50"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 [&::-webkit-details-marker]:hidden">
                  <h4 className="text-lg font-semibold text-slate-900">{tr(item.question.de, item.question.en)}</h4>
                  <span className="text-slate-400 transition group-open:rotate-180">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6">
                  <p className="whitespace-pre-line text-sm text-slate-600">
                    {tr(item.answer.de, item.answer.en)}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
      <section data-animate="section" className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div
            data-animate="card"
            style={stagger(0)}
            className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm"
          >
            <Image
              src="/prodtestbild/produkttestunten.jpeg"
              alt={tr("Produkt Test Eindruck", "Product test impression")}
              width={1600}
              height={900}
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
