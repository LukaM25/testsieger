"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const steps = [
  { title: "Pre-Check ausfüllen", body: "Kostenloser Pre-Check. Wir prüfen Unterlagen und schätzen den Aufwand." },
  { title: "Produkt einsenden", body: "Nach Zahlung der Grundgebühr erhältst du Versandadresse und Rechnung." },
  { title: "Testsieger Check", body: "Labor- und Praxistests nach Standard. Transparenter Bericht." },
  { title: "Lizenzpläne aktivieren", body: "Du zahlst erst, wenn dein Produkt bestanden hat." },
];

type Plan = {
  key: "BASIC" | "PREMIUM" | "LIFETIME";
  name: string;
  theme: "sky" | "indigo" | "midnight";
  usage: string[];
  contents: string[];
  basePriceEur: number;
  billing: "daily" | "one-time";
  footer: string[];
};

const plans: Plan[] = [
  {
    key: "BASIC",
    name: "Basic",
    theme: "sky",
    usage: ["1 Verkaufskanal (Amazon, Otto...)", "Sprache: Deutsch"],
    contents: ["Siegel", "Zertifikat", "Prüfbericht"],
    basePriceEur: 0.99,
    billing: "daily",
    footer: ["Abrechnung 365 Tage / Jahr", "Lizenzverlängerung jährlich."],
  },
  {
    key: "PREMIUM",
    name: "Premium",
    theme: "indigo",
    usage: ["ALLE Verkaufskanäle", "ALLE Sprachen"],
    contents: ["Siegel", "Zertifikat", "Prüfbericht"],
    basePriceEur: 1.47,
    billing: "daily",
    footer: ["Abrechnung 365 Tage / Jahr", "Lizenzverlängerung jährlich."],
  },
  {
    key: "LIFETIME",
    name: "Lifetime",
    theme: "midnight",
    usage: ["ALLE Verkaufskanäle", "ALLE Sprachen"],
    contents: ["Siegel", "Zertifikat", "Prüfbericht"],
    basePriceEur: 1466,
    billing: "one-time",
    footer: ["Abrechnung 365 Tage / Jahr", "Lizenzverlängerung jährlich."],
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

function Reveal({
  children,
  delay = 0,
  duration = 360,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: `opacity ${duration}ms ease ${delay}ms, transform ${duration}ms ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function Packages() {
  const searchParams = useSearchParams();
  const preselectedPlanRaw = (searchParams.get("plan") || "").toUpperCase();
  const preselectedPlan = ["BASIC", "PREMIUM", "LIFETIME"].includes(preselectedPlanRaw) ? preselectedPlanRaw : null;
  const formatEur = (amount: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount);
  const roundEur = (n: number) => Math.round(n * 100) / 100;

  return (
    <main className="text-slate-900" style={{ backgroundColor: '#EEF4ED' }}>
      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_15%_10%,#e0f2fe_0%,transparent_45%),radial-gradient(120%_80%_at_85%_0%,#e2e8f0_0%,transparent_50%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-16 space-y-10">
          <Reveal className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 ring-1 ring-slate-200/70">
              Lizenzpläne Produktsiegel
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-slate-900">Zahle erst, wenn dein Produkt bestanden hat.</h1>
            <p className="text-lg text-slate-700 max-w-3xl">
              Wir prüfen dein Produkt im Testsieger Check. Erst nach bestandenem Ergebnis wählst du den passenden Lizenzplan für das Siegel.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/produkte/produkt-test"
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
              >
                Pre-Check starten
              </Link>
              <Link
                href="/precheck"
                className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Produkt Test (Testsieger Check)
              </Link>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-stretch">
            {steps.map((step, idx) => (
              <Reveal key={step.title} delay={idx * 80}>
                <div className="h-full rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] flex flex-col">
                  <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                    {idx + 1}
                  </div>
                  <div className="text-lg font-semibold text-slate-900">{step.title}</div>
                  <p className="mt-2 text-sm text-slate-700 leading-relaxed">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="space-y-6 text-left">
              <Reveal delay={0}>
                <h2 className="text-4xl sm:text-6xl font-semibold leading-tight text-slate-900 flex flex-wrap items-center gap-3 sm:gap-4">
                  <span>Spare mehrere Hundert Euro Werbebudget ein.</span>
                  <Reveal delay={180} className="inline-flex">
                    <Image
                      src="/checkmark.png"
                      alt="Checkmark"
                      width={60}
                      height={60}
                      className="h-10 w-10 sm:h-[3rem] sm:w-[3rem] object-contain align-middle"
                    />
                  </Reveal>
                </h2>
              </Reveal>
              <Reveal delay={300}>
                <p className="text-3xl sm:text-[2.35rem] font-medium text-slate-900">
                  Verbrenne nicht unnötig Werbebudget
                </p>
              </Reveal>
            </div>
            <Reveal delay={420} duration={520} className="flex items-center justify-center md:justify-end h-full">
              <img
                src="/cashdrop.jpeg"
                alt="Cash drop"
                className="w-full max-w-[421px] sm:max-w-[518px] h-full object-contain"
              />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-slate-50/80">
        <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
          <Reveal className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Lizenzpläne</p>
            <h2 className="text-3xl font-semibold text-slate-900">Wähle deinen Plan</h2>
            <p className="text-slate-700 max-w-2xl">
              Alle Pläne aktivieren das Prüf­siegel nach bestandenem Test. Zahlungsfreigabe erst nach erfolgreichem Ergebnis.
            </p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, idx) => {
              const theme = planThemes[plan.theme];
              const priceSuffix = plan.billing === "daily" ? " / Tag" : "";
              const priceRows =
                plan.billing === "daily"
                  ? [
                      {
                        label: "1 Prod.",
                        price: `${formatEur(roundEur(plan.basePriceEur))}${priceSuffix}`,
                      },
                      {
                        label: "2 Prod. -20%",
                        price: `${formatEur(roundEur(plan.basePriceEur * 0.8))}${priceSuffix}`,
                      },
                      {
                        label: "3 Prod. -30%",
                        price: `${formatEur(roundEur(plan.basePriceEur * 0.7))}${priceSuffix}`,
                      },
                    ]
                  : [
                      {
                        label: "1 Prod.",
                        price: `${formatEur(roundEur(plan.basePriceEur))}`,
                      },
                      {
                        label: "2 Prod. -20%",
                        price: `${formatEur(roundEur(plan.basePriceEur * 2 * 0.8))}`,
                      },
                      {
                        label: "3 Prod. -30%",
                        price: `${formatEur(roundEur(plan.basePriceEur * 3 * 0.7))}`,
                      },
                    ];
              const highlighted = preselectedPlan === plan.key;
              return (
                <Reveal key={plan.key} delay={idx * 60 + 60}>
                  <div
                    className="flex h-full flex-col items-center gap-4"
                  >
                    <div className="text-lg font-semibold text-slate-900">{plan.name}</div>
                    <div
                      className={`flex h-full w-full flex-col justify-between rounded-[28px] border ${theme.border} ${theme.card} p-6 text-center font-semibold shadow-[0_28px_60px_-40px_rgba(15,23,42,0.65)] transition-transform duration-300 hover:-translate-y-1 ${
                        highlighted ? "ring-2 ring-slate-900/10 border-slate-900/50" : ""
                      }`}
                    >
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className={`text-[15.4px] font-semibold ${theme.label}`}>Nutzung:</div>
                          <div className={`space-y-1 text-[15.4px] ${theme.body}`}>
                            {plan.usage.map((line) => (
                              <div key={line}>{line}</div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className={`text-[15.4px] font-semibold ${theme.label}`}>Inhalt:</div>
                          <div className={`space-y-1 text-[15.4px] ${theme.body}`}>
                            {plan.contents.map((line) => (
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
                        {plan.footer.map((line) => (
                          <div key={line}>{line}</div>
                        ))}
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      className={`mt-2 w-full rounded-full bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-black ${
                        highlighted ? "ring-2 ring-slate-900/15" : ""
                      }`}
                    >
                      Zum Kundendashboard
                    </Link>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-slate-900">Noch keinen Pre-Check gestartet?</div>
                <p className="text-sm text-slate-700">
                  Beginne mit dem Testsieger Check. Nach bestandenem Ergebnis kannst du deinen Lizenzplan freischalten.
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/produkte/produkt-test" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black">
                  Zum Pre-Check
                </Link>
                <Link
                  href="/precheck"
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Mehr zum Ablauf
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
