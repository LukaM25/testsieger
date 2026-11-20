"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BadgeCheck, Check, Clock, FolderCheck, Globe, Infinity as InfinityIcon, Percent, ShieldCheck, Store, Users } from "lucide-react";
import { stagger } from "@/lib/animation";
import PrecheckForm from "@/components/precheck/PrecheckForm";
import Counter from "@/components/Counter";
import { useLocale } from "@/components/LocaleProvider";
import MarketplaceLogos from "@/components/MarketplaceLogos";
import AblaufTimeline from "@/components/produkt/AblaufTimeline";
import SiegelErklaert from "@/components/produkt/SiegelErklaert";
import PruefKriterien from "@/components/produkt/PruefKriterien";
import SparenIllustration from "@/components/produkt/SparenIllustration";
import WarumSeller from "@/components/produkt/WarumSeller";
import VorteileCards from "@/components/produkt/VorteileCards";

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
  billing: "daily" | "yearly" | "one-time";
  footer: { de: string[]; en: string[] };
};

export type LiveTestedProduct = {
  id: string;
  name: string;
  brand: string;
  category: string | null;
  certificateCreatedAt: string;
  licenseStatus: string | null;
  reportUrl: string | null;
  certificateUrl: string | null;
  sealUrl: string | null;
  sealNumber: string | null;
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

const STANDARD_NET_EUR = 179;

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
    basePriceEur: 177,
    billing: "yearly",
    footer: {
      de: ["Jahreslizenz, 12 Monate", "Lizenzverlängerung jährlich."],
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
    basePriceEur: 225,
    billing: "yearly",
    footer: {
      de: ["Jahreslizenz, 12 Monate", "Lizenzverlängerung jährlich."],
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
    basePriceEur: 689,
    billing: "one-time",
    footer: {
      de: ["Abrechnung einmalig", "Lizenzverlängerung jährlich."],
      en: ["Billing once", "License renewal yearly."],
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

const pageTitleClass = "text-4xl leading-tight tracking-tight text-[#2B4066] sm:text-5xl lg:text-6xl";
const sectionTitleClass = "text-3xl font-semibold leading-tight tracking-tight text-[#2B4066] sm:text-4xl";
const subsectionTitleClass = "text-2xl font-semibold leading-tight tracking-tight text-[#2B4066] sm:text-3xl";
const cardTitleClass = "text-lg font-semibold leading-snug text-[#2B4066] sm:text-xl";
const pageSubtitleClass = "text-base leading-relaxed text-slate-600 sm:text-lg";
const carouselImages = [
  "/carosel/mole-repeller-solar.jpeg",
  "/carosel/mole-repeller-akku.jpeg",
];

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
        de: 'Nach Eingang des Produkts planen wir für den vollständigen Produkttest inklusive Prüfbericht und Zertifikat 14-21 Tage ein.\nMit unserem Prioritäts-Service kann die Bearbeitungszeit auf 7 Tage reduziert werden.',
        en: 'After the product arrives, we plan 14-21 days for the full product test including report and certificate.\nWith our priority service, turnaround can be reduced to 7 days.',
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
        de: 'Sie erhalten eine klare, sachliche Rückmeldung, welche Punkte nicht erfüllt wurden. Sie können Ihr Produkt anpassen und erneut kostenlos zur Prüfung einreichen.\nEin Siegel wird erst nach bestandener Prüfung vergeben. Die Lizenzgebühren werden erst nach bestandener Prüfung fällig - vorab ist lediglich die Gebühr für den Prüfaufwand zu entrichten.',
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
      question: { de: 'Welche Kosten entstehen - und wann?', en: 'What costs arise - and when?' },
      answer: {
        de: 'Nach dem kostenlosen bestandenen Pre-Check kann das Produkt an uns geschickt werden.\nFür den Prüfungsaufwand, das Erstellen der Zertifikate und Berichte wird eine Grundgebühr von 179 € erhoben.\nNach Abschluss der Prüfung und dem vorliegenden Testergebnis kann der Lizenzplan gewählt werden.\nDer Lizenzplan ist individuell auszuwählen und wird für ein komplettes Jahr bezahlt. Ist das Ergebnis nicht zufriedenstellend, muss kein Lizenzplan ausgewählt werden - somit wird auch kein Siegel und Zertifikat ausgestellt.',
        en: 'After the free pre-check is passed, the product can be sent to us.\nA base fee of €179 is charged for the testing effort and the creation of certificates and reports.\nAfter the test is completed and the result is available, you can choose a license plan.\nThe license plan is selected individually and paid for a full year.\nIf the result is not satisfactory, no license plan is required - therefore no seal or certificate is issued.',
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

function LiveTestedProductsOverview({
  products,
  tr,
  locale,
}: {
  products: LiveTestedProduct[];
  tr: (de: string, en: string) => string;
  locale: string;
}) {
  const dateFormatter = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <section data-animate="section" className="-mt-2 pb-10 lg:pb-12">
      <div className="mx-auto max-w-6xl px-6">
        <div
          className="rounded-3xl border border-gray-100 bg-white p-7 shadow-xl shadow-brand-dark/5 animate-fade-in-up"
          data-animate="section"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-primary">
                {tr("Live-Übersicht", "Live overview")}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-brand-dark">
                {tr("Zuletzt geprüfte Produkte", "Recently tested products")}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {tr(
                  "Neue Prüfungen mit freigegebenem Prüfbericht und nutzbarem Siegel auf einen Blick.",
                  "New tests with released reports and usable seals at a glance."
                )}
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {tr("Live aktualisiert", "Updated live")}
            </span>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {products.map((product) => (
              <article
                key={product.id}
                className="flex min-h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-[#F0F6FA] shadow-sm"
              >
                <div className="flex items-start gap-4 p-4">
                  <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white bg-white">
                    {product.sealUrl ? (
                      <img
                        src={product.sealUrl}
                        alt=""
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <span className="px-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                        {tr("Siegel folgt", "Seal pending")}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-brand-primary">
                        {product.licenseStatus === "ACTIVE"
                          ? tr("Aktive Lizenz", "Active license")
                          : tr("Geprüft", "Tested")}
                      </span>
                      <span className="text-xs text-gray-500">
                        {dateFormatter.format(new Date(product.certificateCreatedAt))}
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold leading-snug text-brand-dark">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">{product.brand}</p>
                    {product.category && (
                      <p className="mt-2 text-xs font-medium text-gray-500">
                        {product.category}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-auto border-t border-white/80 bg-white/80 p-4">
                  <div className="flex flex-wrap gap-2">
                    {product.reportUrl ? (
                      <Link
                        href={product.reportUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-dark"
                      >
                        {tr("Prüfbericht", "Report")}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex cursor-not-allowed items-center justify-center rounded-lg bg-gray-200 px-3 py-2 text-xs font-semibold text-gray-500"
                      >
                        {tr("Prüfbericht folgt", "Report pending")}
                      </button>
                    )}
                    {product.certificateUrl ? (
                      <Link
                        href={product.certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-lg border border-brand-primary/30 bg-white px-3 py-2 text-xs font-semibold text-brand-dark transition hover:-translate-y-0.5 hover:border-brand-primary hover:text-brand-primary"
                      >
                        {tr("Zertifikat", "Certificate")}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-400"
                      >
                        {tr("Zertifikat folgt", "Certificate pending")}
                      </button>
                    )}
                    {product.sealUrl ? (
                      <Link
                        href={product.sealUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-lg border border-brand-primary/30 bg-white px-3 py-2 text-xs font-semibold text-brand-dark transition hover:-translate-y-0.5 hover:border-brand-primary hover:text-brand-primary"
                      >
                        {tr("Siegel öffnen", "Open seal")}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-400"
                      >
                        {tr("Siegel folgt", "Seal pending")}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ProduktTestPage({
  recentTestedProducts = [],
}: {
  recentTestedProducts?: LiveTestedProduct[];
}) {
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const tr = (de: string, en: string) => (locale === 'en' ? en : de);
  const [showPrecheck, setShowPrecheck] = useState(false);
  const [precheckSticky, setPrecheckSticky] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const precheckCtaRef = useRef<HTMLButtonElement | null>(null);
  const precheckSectionRef = useRef<HTMLElement | null>(null);
  const procedureTopRef = useRef<HTMLDivElement | null>(null);
  const procedureDetailRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasPlayedVideoRef = useRef(false);

  const handlePrecheckToggle = () => {
    setShowPrecheck((s) => !s);
  };

  const handleStickyClick = () => {
    if (!showPrecheck) setShowPrecheck(true);
    if (precheckSectionRef.current) {
      precheckSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    

    const node = precheckCtaRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      const updateSticky = () => {
        const rect = node.getBoundingClientRect();
        setPrecheckSticky(rect.bottom < 72);
      };
      updateSticky();
      window.addEventListener('scroll', updateSticky, { passive: true });
      window.addEventListener('resize', updateSticky);
      return () => {
        window.removeEventListener('scroll', updateSticky);
        window.removeEventListener('resize', updateSticky);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setPrecheckSticky(entry.isIntersecting ? false : entry.boundingClientRect.bottom < 72);
      },
      {
        threshold: 0,
        rootMargin: '-72px 0px 0px 0px',
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isCoarsePointer, showPrecheck]);

  const scrollToPrecheck = () => {
    precheckSectionRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  };
  const scrollToProcedure = () => {
    procedureTopRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  };
  const scrollToProcedureDetails = () => {
    procedureDetailRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    procedureDetailRef.current?.classList.add('ring-2', 'ring-[#134074]', 'shadow-2xl', 'transition', 'duration-500');
    setTimeout(() => {
      procedureDetailRef.current?.classList.remove('ring-2', 'ring-[#134074]', 'shadow-2xl', 'transition', 'duration-500');
    }, 1800);
  };
  const goPrevSlide = () => {
    setCarouselIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };
  const goNextSlide = () => {
    setCarouselIndex((prev) => (prev + 1) % carouselImages.length);
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
    if (isCoarsePointer || prefersReducedMotion || showPrecheck) return;
    const id = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselImages.length);
    }, 3200);
    return () => clearInterval(id);
  }, [isCoarsePointer, prefersReducedMotion, showPrecheck]);

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
<main className="overflow-x-clip bg-white text-slate-900">
      {precheckSticky && (
        <div className="fixed top-16 left-0 right-0 z-40 flex justify-center px-4">
          <button
            type="button"
            onClick={handleStickyClick}
            className="cta-enter cta-glow group relative flex items-center gap-3 overflow-hidden rounded-full px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-white shadow-[0_16px_30px_-18px_rgba(29,78,216,0.55)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-16px_rgba(29,78,216,0.6)]"
            style={{ backgroundImage: "linear-gradient(90deg, #1d4ed8 0%, #1e3a8a 55%, #0f172a 100%)" }}
            aria-label={tr('Kostenloser Pre-Check', 'Free pre-check')}
          >
            <span aria-hidden className="cta-shimmer pointer-events-none absolute inset-0" />
            <span className="relative">{tr('Kostenloser Pre-Check', 'Free pre-check')}</span>
            <svg
              className="relative h-4 w-4 animate-bounce"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.06z" />
            </svg>
          </button>
        </div>
      )}
      <section data-animate="section" className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 sm:flex-row sm:items-center sm:justify-between lg:py-20">
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
              <h1 data-animate="hero-title" className={pageTitleClass}>
  <span className="font-light">{tr('Ihr Produkt', 'Your product')}</span>{' '}
  <span className="font-bold">{tr('verdient Vertrauen', 'deserves trust')}</span>
</h1>

              <p data-animate="hero-text" className={pageSubtitleClass}>
                {tr(
                  'Wir begleiten Sie vom Pre-Check bis zum Siegel - transparent, digital und mit einem klaren Bewertungsrahmen.',
                  'We support you from pre-check to seal - transparent, digital, and with a clear evaluation framework.'
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              data-animate="hero-cta"
              onClick={handlePrecheckCta}
              className="cta-glow group relative mt-3 inline-flex items-center gap-3 overflow-hidden rounded-full px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_18px_40px_-16px_rgba(29,78,216,0.55)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-16px_rgba(29,78,216,0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
              style={{ backgroundImage: "linear-gradient(90deg, #1d4ed8 0%, #1e3a8a 60%, #0f172a 100%)" }}
            >
              <span aria-hidden className="cta-shimmer pointer-events-none absolute inset-0" />
              <span className="relative">{tr('Kostenlos Pre-Check starten', 'Start free pre-check')}</span>
              <ArrowRight className="relative h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </button>
            <p className="mt-3 w-full text-sm text-slate-500">
              {tr('Kostenlos · Dauert nur 3 Minuten', 'Free · Takes only 3 minutes')}
            </p>
          </div>
        </div>
        {/* right-side visual: layered siegel images with entrance animation */}
        <div
          data-animate="hero-image"
          className="flex flex-1 items-center justify-end relative z-10 overflow-visible"
        >
            <div
              className="relative flex items-center justify-start w-[360px] h-[360px] overflow-visible pointer-events-none"
              style={{ marginLeft: 'auto', marginRight: 'clamp(0px, 4vw, 56px)' }}
            >
            {/* front card */}
            <div
              className="absolute transition-all duration-[1200ms] ease-in-out will-change-transform drop-shadow-2xl"
              style={{
                width: '280px',
                height: '280px',
                opacity: heroAnim ? 1 : 0,
                transform: heroAnim
                  ? 'translate(0%, 0%) scale(1.05)'
                  : 'translate(60%, 6%) scale(0.95)',
              }}
            >
              <div className="seal-float relative h-full w-full">
                <Image
                  src="/siegel19.png"
                  alt="Testsieger Siegel"
                  fill
                  sizes="280px"
                  className="object-contain"
                  priority
                />
                <div
                  aria-hidden
                  className="seal-shine pointer-events-none absolute inset-0"
                  style={{
                    WebkitMaskImage: "url(/siegel19.png)",
                    maskImage: "url(/siegel19.png)",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vertrauen in Zahlen: schlanke Leiste direkt unter dem Hero */}
      <section data-animate="section" className="px-6 pb-4" aria-label={tr('Vertrauen in Zahlen', 'Trust in numbers')}>
        <p className="mb-3 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-sky-700/80">
          <span className="relative flex h-2 w-2">
            <span className="pin-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          {tr('Live-Zahlen', 'Live numbers')}
        </p>
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-4 shadow-[0_18px_50px_-38px_rgba(43,64,102,0.4)] sm:px-8">
          <ul className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              { Icon: BadgeCheck, label: tr('Siegel vergeben', 'Seals awarded'), prefix: '', end: 477, start: 47, duration: 4000 },
              { Icon: Users, label: tr('Klienten', 'Clients'), prefix: '', end: 233, start: 0, duration: 3200 },
              { Icon: FolderCheck, label: tr('Projekte abgeschlossen', 'Projects completed'), prefix: tr('über ', 'over '), end: 1500, start: 0, duration: 3600 },
            ].map(({ Icon, label, prefix, end, start, duration }) => (
              <li key={label} className="group flex items-center justify-center gap-3 px-4 py-3 sm:py-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100 transition duration-500 group-hover:-translate-y-0.5">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-left leading-tight">
                  <span className="block text-xl font-semibold tabular-nums tracking-tight text-[#2B4066]">
                    {prefix}
                    <Counter start={start} end={end} duration={duration} />
                  </span>
                  <span className="block text-xs text-slate-500">{label}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <VorteileCards />
      <SiegelErklaert />
      <AblaufTimeline />
      {searchParams?.get('direktZahlung') === 'success' && (
        <div className="mx-auto mt-6 max-w-3xl px-4">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900">
            <Check className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="text-sm md:text-base">
              {tr(
                'Zahlung erfolgreich. Wir senden Ihnen jetzt eine E-Mail mit Ihren Zugangsdaten (E-Mail-Adresse und vorläufiges Passwort) für das Kundendashboard. Bitte ändern Sie das Passwort nach dem ersten Login.',
                'Payment successful. We are sending you an email with your dashboard login (email and temporary password). Please change the password after your first login.'
              )}
            </p>
          </div>
        </div>
      )}

      <section id="precheck" ref={precheckSectionRef} className="mx-auto max-w-3xl scroll-mt-28 px-4 py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-[0_30px_80px_-50px_rgba(43,64,102,0.45)] sm:px-12 sm:py-14">
          <div className="seal-glow pointer-events-none absolute -top-20 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="relative">
            <span className="eyebrow">{tr('Jetzt starten', 'Start now')}</span>
            <h2 className={sectionTitleClass}>{tr('Ihr Produkt. Ihr Siegel. In 3 Minuten gestartet.', 'Your product. Your seal. Started in 3 minutes.')}</h2>
            <p className="lead mx-auto mt-4 max-w-xl">
              {tr('Geben Sie Ihre Produktdaten ein. Wir prüfen vorab, ob Ihr Produkt für eine Prüfung in Frage kommt.', 'Enter your product data. We check up front whether your product qualifies for testing.')}
            </p>

            <ul className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-[#2B4066]">
              <li className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                {tr('Kostenlos', 'Free of charge')}
              </li>
              <li className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-sky-600" aria-hidden="true" />
                {tr('Dauert nur 3 Minuten', 'Takes only 3 minutes')}
              </li>
              <li className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sky-600" aria-hidden="true" />
                {tr('Ergebnis vor der Testgebühr', 'Result before any test fee')}
              </li>
            </ul>

            <div className="mt-9 flex flex-col items-center gap-4">
              <button
                ref={precheckCtaRef}
                type="button"
                onClick={handlePrecheckToggle}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePrecheckToggle(); }}
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-9 py-4 text-base font-semibold text-white shadow-[0_18px_40px_-18px_rgba(30,58,138,0.7)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-16px_rgba(30,58,138,0.75)] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
                style={{ backgroundImage: "linear-gradient(90deg, #1E3A8A 0%, #2B4066 100%)" }}
                aria-expanded={showPrecheck}
                aria-controls="precheck-content"
              >
                <span aria-hidden className="cta-shimmer pointer-events-none absolute inset-0" />
                <span className="relative">{showPrecheck ? tr('Pre-Check schließen', 'Close pre-check') : tr('Kostenlosen Pre-Check starten', 'Start free pre-check')}</span>
                <ArrowRight
                  className={`relative h-5 w-5 transition-transform duration-300 ${showPrecheck ? '-rotate-90' : 'group-hover:translate-x-1'}`}
                  aria-hidden="true"
                />
              </button>
              {ctaNotice && <p className="text-sm font-semibold text-emerald-900 text-center px-4">{ctaNotice}</p>}
            </div>
          </div>
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

      <section data-animate="section" className="mx-auto max-w-6xl px-6 pt-4 pb-12">
          <div className="rounded-3xl border border-slate-100 bg-white/90 p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.25)] md:p-10">
            <div className="space-y-3 text-center">
              <h3 className={subsectionTitleClass}>
                {tr("Weitere Produkte hinzufügen und sparen.", "Add more products and save.")}
              </h3>
              <p className={pageSubtitleClass}>
                {tr("Für den Prüfaufwand fällt eine einmalige Testgebühr an.", "A one-time test fee applies for the testing effort.")}
              </p>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {savingsTiers.map((tier) => (
                <div
                  key={tier.count}
                  className="relative flex flex-col overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/70 via-white to-white p-6 text-center shadow-[0_18px_42px_-34px_rgba(29,78,216,0.75)] ring-1 ring-white transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_22px_50px_-34px_rgba(29,78,216,0.9)]"
                >
                  <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1d4ed8] via-[#60a5fa] to-transparent" />
                  <div className="flex items-center justify-center">
                    <h4 className="text-xl font-semibold text-[#2B4066]">{productCountLabel(tier.count)}</h4>
                  </div>
                  <div className="mb-6 mt-6 space-y-2 text-slate-700">
                    <div className="flex h-16 items-center justify-center">
                      <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-blue-50 px-4 py-2.5 text-base font-bold shadow-[0_12px_26px_-20px_rgba(29,78,216,0.9)]">
                        <span className={`text-slate-500 line-through decoration-2 ${tier.discountPercent === 0 ? "hidden" : ""}`}>{formatEur(baseNetPerProduct)}</span>
                        <span
                          className="rounded-full px-3 py-1 text-sm font-extrabold shadow-sm"
                          style={{ backgroundColor: "#1d4ed8", color: "#ffffff" }}
                        >
                          {tr("Spare", "Save")} {tier.discountPercent}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-500">{tr("Testgebühr pro Produkt", "Test fee per product")}</p>
                    <p className="text-3xl font-semibold tracking-tight text-[#2B4066] tabular-nums">
                      {formatEur(roundEur(tier.finalNet / tier.count))}
                    </p>
                    <p className="text-sm text-slate-600">
                      {tier.count > 1
                        ? tr(`Gesamt ${formatEur(tier.finalNet)} für ${tier.count} Produkte`, `Total ${formatEur(tier.finalNet)} for ${tier.count} products`)
                        : tr("einmalig, netto", "one-time, net")}
                    </p>
                  </div>
                  <Link
                    href={`/precheck?produkte=${tier.count}#checkout-options`}
                    className="group mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#16294d] shadow-[0_14px_28px_-16px_rgba(29,78,216,0.7)] px-5 py-3 text-sm font-semibold !text-white transition hover:-translate-y-0.5 hover:brightness-110"
                  >
                    {tier.count === 1 ? tr("Produkt einreichen", "Submit product") : tr(`${tier.count} Produkte einreichen`, `Submit ${tier.count} products`)}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </div>
            <Link
              href="/kontakt?kategorie=quote"
              className="group relative mt-6 flex flex-col items-center gap-4 overflow-hidden rounded-2xl border border-sky-200/70 bg-gradient-to-r from-sky-50 via-white to-sky-50 p-5 text-center shadow-[0_18px_44px_-34px_rgba(43,64,102,0.5)] transition duration-500 hover:-translate-y-0.5 hover:border-sky-300 sm:flex-row sm:text-left"
            >
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-sky-200 text-sky-700 ring-1 ring-sky-200">
                <span className="vorteil-halo absolute inset-0 rounded-2xl" aria-hidden="true" />
                <Users className="vorteil-bob relative h-6 w-6" aria-hidden="true" />
              </span>
              <span className="flex-1">
                <span className="block text-lg font-semibold text-[#2B4066]">
                  {tr("Mehr als 3 Produkte?", "More than 3 products?")}
                </span>
                <span className="block text-sm text-slate-600">
                  {tr("Sie erhalten ein individuelles Angebot mit besseren Konditionen.", "You get a custom quote with better terms.")}
                </span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#16294d] shadow-[0_14px_28px_-16px_rgba(29,78,216,0.7)] px-5 py-2.5 text-sm font-semibold !text-white transition group-hover:brightness-110">
                {tr("Angebot anfragen", "Request a quote")}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
            <div className="mt-8 flex flex-col items-center gap-5 text-center">
              <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto">
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPrecheck(true);
                      requestAnimationFrame(() => scrollToPrecheck());
                    }}
                    className="inline-flex min-w-[220px] items-center justify-center gap-4 rounded-lg bg-gradient-to-r from-[#1d4ed8] via-[#1e40af] to-[#0f172a] px-7 py-4 text-base font-semibold text-white shadow-[0_18px_34px_-18px_rgba(29,78,216,0.75)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-18px_rgba(29,78,216,0.85)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8]"
                  >
                    {tr("Prüfung starten", "Test process start")}
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={scrollToProcedureDetails}
                    className="inline-flex items-center justify-center gap-3 rounded-lg px-2 py-2 text-base font-semibold text-[#1d4ed8] transition hover:text-[#1e3a8a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8]"
                  >
                    {tr("Prüfverfahren im Detail", "Testing procedure in Detail")}
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
      </section>

      <LiveTestedProductsOverview products={recentTestedProducts} tr={tr} locale={locale} />
      {/* Inserted Pre-Check form inline so the Produkt Test page is self-contained */}
      <section data-animate="section" className="bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="space-y-6 text-left">
              <span className="eyebrow !mb-0">{tr('Werbebudget', 'Ad budget')}</span>
              <h2 className={sectionTitleClass}>
                <span>{tr('Sparen Sie mehrere Hundert Euro Werbebudget ein.', 'Save hundreds of euros in marketing budget.')}</span>
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
              <p className="lead">
                {tr('Verbrenne nicht unnötig Werbebudget', "Don't burn marketing budget unnecessarily")}
              </p>
            </div>
            <div className="flex h-full items-center justify-center md:justify-end">
              <div data-animate="card" className="aspect-square w-full max-w-[420px]">
                <SparenIllustration label={tr('Münze fällt in eine offene Hand', 'Coin falling into an open hand')} />
              </div>
            </div>
          </div>
        </div>
      </section>

      


      <section data-animate="section" className="mx-auto max-w-6xl px-6 pt-8 pb-16">
        <div className="space-y-12">


            {/* NEW SECTION */}
      <WarumSeller onCta={handlePrecheckCta} />
      {/* END NEW SECTION */}

          {/* Lizenzpläne: kompakte Übersicht, Details auf /pakete */}
          <div className="pt-10 text-center">
            <span className="eyebrow">{tr("Lizenzpläne", "License plans")}</span>
            <h3 className={subsectionTitleClass}>
              {tr("Erst nach bestandener Prüfung.", "Only after your product passes.")}
            </h3>
            <p className="lead mx-auto mt-3 max-w-xl">
              {tr("Die Lizenz wird nur für bestandene Produkte aktiviert.", "The license is only activated for products that pass.")}
            </p>
          </div>
          <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
            {plans.map((plan, i) => {
              const PlanIcon = plan.name === "Basic" ? Store : plan.name === "Premium" ? Globe : InfinityIcon;
              const isDaily = plan.billing !== "one-time";
              const yearly = plan.billing === "daily" ? roundEur(plan.basePriceEur * 365) : plan.basePriceEur;
              const tagline =
                plan.name === "Basic"
                  ? tr("Ein Verkaufskanal", "One sales channel")
                  : plan.name === "Premium"
                  ? tr("Alle Kanäle & Sprachen", "All channels & languages")
                  : tr("Einmal zahlen", "Pay once");
              return (
                <Link
                  key={plan.name}
                  href={`/pakete?plan=${plan.name.toUpperCase()}`}
                  data-animate="card"
                  style={stagger(i)}
                  className="group relative flex flex-col items-center overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 text-center shadow-[0_20px_60px_-40px_rgba(43,64,102,0.35)] transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_28px_70px_-34px_rgba(43,64,102,0.45)]"
                >
                  <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-100/70 blur-2xl transition-transform duration-700 group-hover:scale-150" />
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 text-sky-700 ring-1 ring-sky-100 transition duration-500 group-hover:rotate-3">
                    <PlanIcon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <p className="relative mt-4 text-lg font-semibold text-[#2B4066]">{plan.name}</p>
                  <p className="relative text-sm text-slate-500">{tagline}</p>
                  <p className="relative mt-4 text-sm text-slate-700">
                    {isDaily ? (
                      <>
                        <span className="text-lg font-semibold tabular-nums text-[#2B4066]">{formatEur(yearly)}</span>{" "}
                        {tr("pro Jahr", "per year")}
                      </>
                    ) : (
                      <>
                        <span className="text-lg font-semibold tabular-nums text-[#2B4066]">{formatEur(plan.basePriceEur)}</span>{" "}
                        {tr("einmalig", "one-time")}
                      </>
                    )}
                  </p>
                  <div className="relative mt-4 w-full space-y-1.5 rounded-2xl bg-slate-50 px-2.5 py-3 text-[13px]">
                    {[
                      { label: tr("2 Produkte", "2 products"), pct: 20, f: 0.8 },
                      { label: tr("3+ Produkte", "3+ products"), pct: 30, f: 0.7 },
                    ].map((row) => (
                      <div key={row.pct} className="flex items-center justify-between gap-1.5 whitespace-nowrap text-slate-600">
                        <span className="flex items-center gap-1">
                          {row.label}
                          <span className="rounded-full bg-emerald-50 px-1 py-0.5 text-[10px] font-semibold text-emerald-700">-{row.pct}%</span>
                        </span>
                        <span className="font-semibold tabular-nums text-[#2B4066]">
                          {formatEur(roundEur((isDaily ? yearly : plan.basePriceEur) * row.f))}
                        </span>
                      </div>
                    ))}
                    <p className="pt-0.5 text-[11px] text-slate-400">
                      {isDaily ? tr("pro Produkt und Jahr", "per product per year") : tr("pro Produkt, einmalig", "per product, one-time")}
                    </p>
                  </div>
                  <span className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 transition-colors group-hover:text-[#2B4066]">
                    {tr("Details ansehen", "View details")}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>




      {/* Pakete section using PackageCard */}
      <section id="pakete" hidden className="mx-auto max-w-6xl px-6 py-16">
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
              preload="none"
            >
              {tr('Ihr Browser unterstützt das Video-Tag nicht.', 'Your browser does not support the video tag.')}
            </video>
          </div>
          <div className="w-full max-w-xl lg:ml-4 flex justify-center lg:justify-start">
            <h2
              data-animate="card"
              className={`${sectionTitleClass} transition-all duration-700 text-balance`}
            >
              {tr('Machen Sie ihr Produkt sichtbar', 'Make your product visible')}
            </h2>
          </div>
        </div>
      </section>

      <section data-animate="section" className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                {tr('Produkt Vorschau', 'Product preview')}
              </p>
              <h2 className="text-2xl font-semibold text-[#2B4066]">
                {tr('So sehen geprüfte Produkte einer unserer Vertrauenspartner aus - EdenGardens', 'A look at tested products from our trusted partner, EdenGardens.')}
              </h2>
              <p className="text-sm text-slate-600">
                {tr(
                  'Beispiele aus aktuellen Bewertungen. Blättern oder warten, um weitere zu sehen.',
                  'Examples from recent reviews. Browse or wait to see more.'
                )}
              </p>
            </div>
            <div className="flex gap-2">
              {carouselImages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCarouselIndex(i)}
                  className={`h-2.5 w-2.5 rounded-full transition ${carouselIndex === i ? 'bg-slate-900' : 'bg-slate-300'}`}
                  aria-label={`${tr('Slide', 'Slide')} ${i + 1}`}
                />
              ))}
            </div>
          </div>
          <div className="relative mt-6 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
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
            <div className="relative h-[280px] w-full sm:h-[340px] md:h-[420px] lg:h-[500px]">
              {carouselImages.map((src, idx) => (
                <div
                  key={src}
                  className={`absolute inset-0 flex items-center justify-center bg-slate-50 transition-opacity duration-500 ${
                    carouselIndex === idx ? 'opacity-100' : 'pointer-events-none opacity-0'
                  }`}
                  aria-hidden={carouselIndex !== idx}
                >
                  <Image
                    src={src}
                    alt={tr('Produkt Vorschaubild', 'Product preview image')}
                    fill
                    sizes="(min-width: 1024px) 960px, (min-width: 768px) 90vw, 100vw"
                    className="object-contain"
                    priority={idx === 0}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section data-animate="section" className="mx-auto max-w-6xl px-6 pb-2">
        <h3 className={`${subsectionTitleClass} text-center`}>
          {tr("Produktsiegel für Amazon Seller, Otto, Kaufland und Ebay", "Product seals for Amazon sellers, Otto, Kaufland and eBay")}
        </h3>
      </section>

      <section data-animate="section" className="mx-auto max-w-6xl px-6 py-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.4)]">
          <Image
            src="/images/neuetestsieger.jpeg"
            alt={tr('Neuer Testsieger', 'New Testsieger')}
            width={1400}
            height={900}
            className="h-[260px] w-full rounded-2xl object-contain bg-slate-50 sm:h-[320px] md:h-[380px] lg:h-[440px]"
          />
        </div>
      </section>

      {/* Prüfverfahren and FAQ */}
      <section data-animate="section" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8" id="unser-pruefverfahren" ref={procedureTopRef}>
          <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg">
            <h2 className={subsectionTitleClass}>{tr('Unser Prüfverfahren', 'Our testing procedure')}</h2>
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
          className="mt-16 rounded-3xl"
        >
          <PruefKriterien />
        </div>

        <div className="mt-12 bg-white pt-8">
          <h3 className={subsectionTitleClass}>{tr('Häufige Fragen', 'Frequently asked questions')}</h3>
          <div className="mt-6 space-y-6">
            {phasesQa.qa.map((item, i) => (
              <details
                key={item.question.de}
                data-animate="card"
                style={stagger(i)}
                className="group rounded-2xl border border-slate-200 bg-slate-50"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 [&::-webkit-details-marker]:hidden">
                  <h4 className={cardTitleClass}>{tr(item.question.de, item.question.en)}</h4>
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
