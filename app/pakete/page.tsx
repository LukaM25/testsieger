"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePrecheckEligibility } from "@/hooks/usePrecheckEligibility";

const steps = [
  { title: "Pre-Check ausfüllen", body: "Kostenloser Pre-Check. Wir prüfen Unterlagen und schätzen den Aufwand." },
  { title: "Produkt einsenden", body: "Nach Zahlung der Grundgebühr erhältst du Versandadresse und Rechnung." },
  { title: "Testsieger Check", body: "Labor- und Praxistests nach Standard. Transparenter Bericht." },
  { title: "Lizenzpläne aktivieren", body: "Du zahlst erst, wenn dein Produkt bestanden hat." },
];

const plans = [
  { key: "BASIC", name: "Basic", price: "0,99 € / Tag (jährlich)", detail: "DE · 1 Kanal" },
  { key: "PREMIUM", name: "Premium", price: "1,47 € / Tag (jährlich)", detail: "EU-Sprachen · alle Kanäle" },
  { key: "LIFETIME", name: "Lifetime", price: "1466 € einmalig", detail: "Zertifikat & Bericht · alle Kanäle" },
];

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
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
        transition: `opacity 360ms ease ${delay}ms, transform 360ms ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function Packages() {
  const router = useRouter();
  const { hasPrecheck, paidAndPassed, loading } = usePrecheckEligibility();
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const guardMessage = "Bitte Pre-Check abschließen, Grundgebühr bezahlen und Prüfung abwarten. Wir leiten dich zum Formular.";

  async function choose(plan: string) {
    setSubmitting(plan);
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setNotice(data.error || "Zahlung konnte nicht gestartet werden.");
        return;
      }
      window.location.href = data.url;
    } finally {
      setSubmitting(null);
    }
  }

  const handleGuardedSelect = (plan: string) => {
    if (!hasPrecheck || !paidAndPassed) {
      setNotice(guardMessage);
      router.push("/produkte/produkt-test");
      return;
    }
    choose(plan);
  };

  return (
    <main className="bg-white text-slate-900">
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
            {notice && <p className="text-sm text-amber-700">{notice}</p>}
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
              const disabled = !hasPrecheck || !paidAndPassed || loading || submitting === plan.key;
              return (
                <Reveal key={plan.key} delay={idx * 60 + 60}>
                  <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)]">
                    <div className="space-y-3">
                      <div className="text-lg font-semibold text-slate-900">{plan.name}</div>
                      <div className="text-base font-semibold text-slate-800">{plan.price}</div>
                      <p className="text-sm text-slate-700 leading-relaxed">{plan.detail}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGuardedSelect(plan.key)}
                      disabled={disabled}
                      className={`mt-8 rounded-full px-4 py-2 text-sm font-semibold ${
                        disabled ? "bg-slate-200 text-slate-500 cursor-not-allowed" : "bg-slate-900 text-white transition hover:bg-black"
                      }`}
                      title={!hasPrecheck || !paidAndPassed ? guardMessage : undefined}
                    >
                      {submitting === plan.key ? "Wird geöffnet…" : "Lizenzplan wählen"}
                    </button>
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
