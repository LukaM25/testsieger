"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarClock,
  Check,
  ClipboardCheck,
  FileCheck,
  FileText,
  FlaskConical,
  Globe,
  Infinity as InfinityIcon,
  Languages,
  PackageCheck,
  ShieldCheck,
  Store,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const steps: { title: string; body: string; Icon: LucideIcon }[] = [
  { title: "Pre-Check ausfüllen", body: "Kostenlos und in rund 3 Minuten. Wir prüfen vorab, ob Ihr Produkt in Frage kommt.", Icon: ClipboardCheck },
  { title: "Produkt einsenden", body: "Nach Zahlung der Testgebühr erhalten Sie Versandadresse und Rechnung.", Icon: PackageCheck },
  { title: "Testsieger Check", body: "Wir prüfen Ihr Produkt nach festem Standard und erstellen einen transparenten Bericht.", Icon: FlaskConical },
  { title: "Plan wählen", body: "Erst nach bestandener Prüfung wählen Sie den Lizenzplan für Ihr Siegel.", Icon: BadgeCheck },
];

type Plan = {
  key: "BASIC" | "PREMIUM" | "LIFETIME";
  name: string;
  tagline: string;
  badge?: string;
  Icon: LucideIcon;
  usage: { text: string; Icon: LucideIcon }[];
  contents: string[];
  basePriceEur: number;
  billing: "daily" | "yearly" | "one-time";
  footer: string[];
  dark?: boolean;
};

const contentIcons = [Award, FileCheck, FileText];

const plans: Plan[] = [
  {
    key: "BASIC",
    name: "Basic",
    tagline: "Für einen Verkaufskanal",
    Icon: Store,
    usage: [
      { text: "1 Verkaufskanal (Amazon, Otto ...)", Icon: Store },
      { text: "Sprache: Deutsch", Icon: Languages },
    ],
    contents: ["Siegel", "Zertifikat", "Prüfbericht"],
    basePriceEur: 177,
    billing: "yearly",
    footer: ["Jahreslizenz, 12 Monate", "Lizenzverlängerung jährlich"],
  },
  {
    key: "PREMIUM",
    name: "Premium",
    tagline: "Für alle Kanäle und Sprachen",
    badge: "Alle Kanäle",
    Icon: Globe,
    usage: [
      { text: "ALLE Verkaufskanäle", Icon: Store },
      { text: "ALLE Sprachen", Icon: Languages },
    ],
    contents: ["Siegel", "Zertifikat", "Prüfbericht"],
    basePriceEur: 225,
    billing: "yearly",
    footer: ["Jahreslizenz, 12 Monate", "Lizenzverlängerung jährlich"],
  },
  {
    key: "LIFETIME",
    name: "Lifetime",
    tagline: "Einmal zahlen, dauerhaft nutzen",
    badge: "Einmalzahlung",
    Icon: InfinityIcon,
    usage: [
      { text: "ALLE Verkaufskanäle", Icon: Store },
      { text: "ALLE Sprachen", Icon: Languages },
    ],
    contents: ["Siegel", "Zertifikat", "Prüfbericht"],
    basePriceEur: 689,
    billing: "one-time",
    footer: ["Abrechnung einmalig", "Lizenzverlängerung jährlich"],
    dark: true,
  },
];

const good: { title: string; body: string; Icon: LucideIcon }[] = [
  { title: "Zahlung erst nach Bestehen", body: "Die Lizenz wird nur für bestandene Produkte aktiviert.", Icon: ShieldCheck },
  { title: "Faire Staffel", body: "Mehrere Produkte: 20 % Rabatt ab 2, 30 % ab 3 Produkten.", Icon: Wallet },
  { title: "Klare Laufzeit", body: "Jahreslizenz mit jährlicher Verlängerung.", Icon: CalendarClock },
];

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
    <main className="overflow-x-clip bg-white text-slate-900">
      {/* Einstieg */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/70 via-white to-white">
        <div className="seal-glow pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-6 pb-14 pt-16 text-center sm:pt-24">
          <Reveal>
            <span className="eyebrow">Lizenzpläne Produktsiegel</span>
            <h1 className="section-title !text-4xl sm:!text-5xl">Wählen Sie Ihren Plan erst, wenn Ihr Produkt bestanden hat.</h1>
            <p className="lead mx-auto mt-5 max-w-2xl">
              Wir prüfen Ihr Produkt im Testsieger Check. Erst nach bestandenem Ergebnis wählen Sie den passenden Lizenzplan für das Siegel.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Ablauf in 4 Schritten */}
      <section className="px-6 pb-16 sm:pb-20">
        <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ title, body, Icon }, idx) => (
            <Reveal key={title} delay={idx * 90} className="h-full">
              <div className="group relative h-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(43,64,102,0.35)] transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_28px_70px_-34px_rgba(43,64,102,0.45)]">
                <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-100/70 blur-2xl transition-transform duration-700 group-hover:scale-150" />
                <div className="relative flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 text-sky-700 ring-1 ring-sky-100 transition duration-500 group-hover:rotate-3">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-slate-300">0{idx + 1}</span>
                </div>
                <h3 className="card-title relative mt-5 !mb-2">{title}</h3>
                <p className="body-text relative text-sm">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Pläne */}
      <section className="bg-gradient-to-b from-slate-50 to-white px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <span className="eyebrow">Lizenzpläne</span>
            <h2 className="section-title">Wählen Sie Ihren Plan</h2>
            <p className="lead mx-auto mt-4 max-w-2xl">
              Alle Pläne aktivieren das Prüfsiegel nach bestandenem Test. Die Zahlung wird erst nach erfolgreichem Ergebnis fällig.
            </p>
          </Reveal>

          <div className="mx-auto mt-14 grid max-w-md items-stretch gap-6 lg:max-w-none lg:grid-cols-3">
            {plans.map((plan, idx) => {
              const daily = plan.billing !== "one-time";
              const yearlyBase = plan.billing === "daily" ? roundEur(plan.basePriceEur * 365) : plan.basePriceEur;
              const suffix = daily ? " / Jahr" : "";
              const rows = [
                { label: "1 Produkt", factor: 1, count: 1, badge: "" },
                { label: "2 Produkte", factor: 0.8, count: 2, badge: "-20 %" },
                { label: "3 Produkte", factor: 0.7, count: 3, badge: "-30 %" },
              ].map((r) => ({
                ...r,
                price: `${formatEur(roundEur(yearlyBase * r.factor))}${suffix}`,
                total: r.count > 1 ? `Gesamt ${formatEur(roundEur(roundEur(yearlyBase * r.factor) * r.count))}` : "",
              }));
                            const highlighted = preselectedPlan === plan.key;
              const dark = !!plan.dark;
              const text = dark ? "text-white" : "text-[#2B4066]";
              const muted = dark ? "text-white/70" : "text-slate-500";
              const body = dark ? "text-white/90" : "text-slate-700";
              return (
                <Reveal key={plan.key} delay={idx * 100} className="h-full">
                  <div
                    className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border p-6 transition duration-500 hover:-translate-y-2 xl:p-7 ${
                      dark
                        ? "border-blue-900/40 bg-gradient-to-b from-[#16294d] to-[#0b1730] shadow-[0_30px_70px_-35px_rgba(11,23,48,0.8)]"
                        : "border-slate-200/80 bg-white shadow-[0_20px_60px_-40px_rgba(43,64,102,0.35)] hover:shadow-[0_30px_70px_-30px_rgba(43,64,102,0.45)]"
                    } ${highlighted ? "ring-2 ring-sky-500" : ""}`}
                  >
                    {plan.badge && (
                      <span className={`absolute right-5 top-5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${dark ? "bg-white/10 text-sky-100" : "bg-sky-50 text-sky-700"}`}>
                        {plan.badge}
                      </span>
                    )}
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 transition duration-500 group-hover:rotate-3 ${dark ? "bg-white/10 text-sky-200 ring-white/10" : "bg-gradient-to-br from-sky-50 to-sky-100 text-sky-700 ring-sky-100"}`}>
                      <plan.Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <h3 className={`mt-5 text-2xl font-semibold ${text}`}>{plan.name}</h3>
                    <p className={`text-sm ${muted}`}>{plan.tagline}</p>

                    <div className="mt-6">
                      <div className={`text-3xl font-semibold tracking-tight tabular-nums ${text}`}>
                        {formatEur(yearlyBase)}
                        <span className={`text-base font-medium ${muted}`}>{daily ? " / Jahr" : " einmalig"}</span>
                      </div>
                      <p className={`mt-1 text-xs ${muted}`}>{daily ? "pro Produkt, jährlich verlängerbar" : "pro Produkt, ohne Folgekosten"}</p>
                    </div>

                    <ul className="mt-6 space-y-3">
                      {plan.usage.map(({ text: t, Icon }) => (
                        <li key={t} className={`flex items-center gap-3 text-sm ${body}`}>
                          <Icon className={`h-5 w-5 shrink-0 ${dark ? "text-sky-300" : "text-sky-600"}`} aria-hidden="true" />
                          {t}
                        </li>
                      ))}
                      {plan.contents.map((t, i) => {
                        const CIcon = contentIcons[i] ?? Check;
                        return (
                          <li key={t} className={`flex items-center gap-3 text-sm ${body}`}>
                            <CIcon className={`h-5 w-5 shrink-0 ${dark ? "text-emerald-300" : "text-emerald-600"}`} aria-hidden="true" />
                            {t}
                          </li>
                        );
                      })}
                    </ul>

                    <div className={`mt-6 space-y-2 rounded-2xl p-4 ${dark ? "bg-white/5" : "bg-slate-50"}`}>
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${muted}`}>Staffelpreise (pro Produkt)</p>
                      {rows.map((row) => (
                        <div key={row.label} className={`flex items-center justify-between gap-3 text-sm tabular-nums ${body}`}>
                          <span className="flex items-center gap-2 whitespace-nowrap">
                            {row.label}
                            {row.badge && (
                              <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${dark ? "bg-emerald-400/15 text-emerald-200" : "bg-emerald-50 text-emerald-700"}`}>
                                {row.badge}
                              </span>
                            )}
                          </span>
                          <span className="flex flex-col items-end whitespace-nowrap">
                            <span className="font-semibold">{row.price}</span>
                            {row.total && <span className={`text-[11px] font-normal ${muted}`}>{row.total}</span>}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className={`mt-5 space-y-1 text-xs ${muted}`}>
                      {plan.footer.map((line) => (
                        <div key={line} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          {line}
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto pt-7">
                    <Link
                      href="/dashboard"
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 ${
                        dark ? "bg-white !text-[#16294d] hover:bg-sky-50" : "bg-[#2B4066] !text-white hover:bg-[#1e3050]"
                      }`}
                    >
                      Zum Kundendashboard
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                    </Link>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* Gut zu wissen */}
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {good.map(({ title, body, Icon }, idx) => (
              <Reveal key={title} delay={idx * 90}>
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-sky-50 text-emerald-600 ring-1 ring-emerald-100">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold text-[#2B4066]">{title}</p>
                    <p className="body-text text-sm">{body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Abschluss */}
      <section className="px-6 pb-20 sm:pb-28">
        <Reveal>
          <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#16294d] via-[#1E3A8A] to-[#0b1730] p-10 text-center text-white shadow-[0_40px_80px_-40px_rgba(11,23,48,0.8)] sm:p-14">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Noch keinen Pre-Check gestartet?</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/80">
              Beginnen Sie mit dem Testsieger Check. Nach bestandenem Ergebnis schalten Sie Ihren Lizenzplan frei.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/produkte/produkt-test"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold !text-[#16294d] transition duration-300 hover:-translate-y-0.5 hover:bg-sky-50"
              >
                Zum Pre-Check
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link href="/precheck" className="rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold !text-white transition hover:bg-white/10">
                Mehr zum Ablauf
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
