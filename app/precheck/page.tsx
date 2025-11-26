"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { useEffect, useState, MouseEvent } from "react";
import { usePrecheckStatusData } from "@/hooks/usePrecheckStatusData";

// --- Types ---
type TestOption = {
  title: { de: string; en: string };
  price: { de: string; en: string };
  timeline: { de: string; en: string };
  href: string;
};

type Plan = {
  name: string;
  price: { de: string; en: string };
  detail: { de: string; en: string };
  href: string;
};

// --- Data ---
const testOptions: TestOption[] = [
  {
    title: { de: "Produkttest Checkout", en: "Product test checkout" },
    price: { de: "254,00 € zzgl. MwSt.", en: "€254 plus VAT" },
    timeline: { de: "14–17 Werktage nach Erhalt", en: "14–17 business days after receipt" },
    href: "/kontakt?anfrage=produkttest-checkout",
  },
  {
    title: { de: "Produkttest Priority", en: "Product test priority" },
    price: { de: "254,00 € + 64 € zzgl. MwSt.", en: "€254 + €64 plus VAT" },
    timeline: { de: "4–7 Werktage nach Erhalt", en: "4–7 business days after receipt" },
    href: "/kontakt?anfrage=produkttest-priority",
  },
];

const plans: Plan[] = [
  {
    name: "Basic",
    price: { de: "0,99 € / Tag (jährlich)", en: "€0.99 / day (yearly)" },
    detail: { de: "DE · 1 Kanal", en: "DE · 1 channel" },
    href: "/pakete?plan=basic",
  },
  {
    name: "Premium",
    price: { de: "1,47 € / Tag (jährlich)", en: "€1.47 / day (yearly)" },
    detail: { de: "EU-Sprachen · alle Kanäle", en: "EU languages · all channels" },
    href: "/pakete?plan=premium",
  },
  {
    name: "Lifetime",
    price: { de: "1466 € einmalig", en: "€1466 one-time" },
    detail: { de: "Zertifikat & Bericht · alle Kanäle", en: "Certificate & report · all channels" },
    href: "/pakete?plan=lifetime",
  },
];

// --- Animation Component ---
const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-all duration-700 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default function PrecheckPage() {
  const { locale } = useLocale();
  const tr = (de: string, en: string) => (locale === "en" ? en : de);
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams?.get("productId") || "";
  const statusState = usePrecheckStatusData({ initialProductId: productId });
  const { productStatus } = statusState;
  const [planNotice, setPlanNotice] = useState<string | null>(null);

  const isPaid = productStatus ? ["PAID", "MANUAL"].includes(productStatus.paymentStatus) : false;
  const isPassed = productStatus
    ? productStatus.adminProgress === "PASS" || productStatus.adminProgress === "COMPLETION" || productStatus.status === "COMPLETED"
    : false;
  const heroHeading = isPaid ? tr("Pre-Check bestanden", "Pre-check passed") : tr("Pre-Check erfolgreich", "Pre-check successful");
  const planDisabledTitle = tr(
    "Bitte zuerst den Pre-Check und die Grundgebühr abschließen. Wir leiten dich zum Formular.",
    "Please finish the pre-check and base fee first. We’ll take you to the form."
  );

  const handlePlanClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const ready = productStatus && isPaid && isPassed;
    if (ready) {
      setPlanNotice(null);
      return;
    }
    e.preventDefault();
    setPlanNotice(
      tr(
        "Bitte zuerst den kostenlosen Pre-Check ausfüllen. Wir leiten dich zum Formular.",
        "Please submit the free pre-check first. We’ll take you to the form."
      )
    );
    router.push("/produkte/produkt-test");
  };

  return (
    <main className="bg-white text-slate-900 overflow-hidden font-sans">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_10%,#e0f2fe_0%,transparent_50%),radial-gradient(140%_90%_at_80%_-10%,#eef2ff_0%,transparent_55%)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-24 space-y-16">
          <FadeIn delay={100}>
            <div className="flex flex-col gap-10 rounded-3xl border border-slate-100/70 bg-white/80 p-8 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.45)] md:flex-row md:items-start md:justify-between md:p-10">
              <div className="space-y-6 max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
                  {tr("1. Ergebnis", "1. Result")}
                </p>
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
                    {heroHeading}
                  </h1>
                  <p className="text-lg md:text-xl font-medium text-slate-800">
                    {tr("Produkt jetzt an uns senden.", "Send your product to us now.")}
                  </p>
                  <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                    {tr(
                      "Hierfür fällt einmalig eine Testgebühr in Höhe von 254,00 € an. Nach Bezahlung senden wir eine E-Mail mit Rechnung und Versandadresse.",
                      "A one-time test fee of €254 is due. After payment we will email your invoice and the shipping address."
                    )}
                  </p>
                </div>
                <div className="inline-flex items-center gap-3 rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-semibold tracking-[0.18em] w-fit shadow-md">
                  {tr("Nächster Schritt: Versand & Zahlung", "Next step: shipping & payment")}
                </div>
              </div>

              <div className="relative shrink-0 w-40 h-40 md:w-56 md:h-56 lg:w-64 lg:h-64 self-start rounded-3xl bg-gradient-to-b from-white to-slate-50 p-3 shadow-inner ring-1 ring-slate-200">
                <Image
                  src="/siegel.png"
                  alt={tr("Testsieger Siegel", "Testsieger seal")}
                  fill
                  className="object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105"
                  priority
                />
              </div>
            </div>
          </FadeIn>

          <div className="space-y-14 md:space-y-16">
            <FadeIn delay={180}>
              <div className="space-y-3">
                <div className="text-2xl font-semibold text-slate-900">
                  {tr("2. Produkt jetzt an uns senden", "2. Send your product to us now")}
                </div>
                <p className="text-slate-600 max-w-3xl leading-relaxed text-lg">
                  {tr(
                    "Wählen Sie den passenden Prüflauf und schließen Sie den Checkout ab, damit wir Versandadresse und Rechnung bereitstellen können.",
                    "Choose the processing speed and complete checkout so we can provide shipping details and your invoice."
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {testOptions.map((option, idx) => (
                  <Link
                    key={option.title.de}
                    href={option.href}
                    className="group relative flex h-full flex-col items-center justify-between overflow-hidden rounded-3xl border border-white/15 px-10 py-12 text-center text-white shadow-[0_28px_80px_-45px_rgba(15,23,42,0.55)] ring-1 ring-slate-900/10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-900/30"
                    style={{
                      backgroundImage: idx === 0
                        ? "linear-gradient(135deg, #0f172a 0%, #1e3a8a 52%, #2563eb 100%)"
                        : "linear-gradient(135deg, #111827 0%, #1d4ed8 50%, #2563eb 100%)",
                    }}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="text-2xl font-semibold leading-tight tracking-tight">
                        {tr(option.title.de, option.title.en)}
                      </div>
                      <div className="text-lg font-medium text-white/95">
                        {tr(option.price.de, option.price.en)}
                      </div>
                      <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/85">
                        {tr(option.timeline.de, option.timeline.en)}
                      </span>
                    </div>

                    <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white transition group-hover:bg-white/25">
                      {tr("Zum Checkout", "Go to checkout")}
                      <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={260}>
              <div className="space-y-4">
                <div className="text-2xl font-semibold text-slate-900">{tr("3. Produktprüfung", "3. Product testing")}</div>
                <p className="text-slate-600 max-w-3xl text-lg leading-relaxed">
                  {tr(
                    "Die Produktprüfung wird innerhalb des angegebenen Zeitraums nach Wareneingang durchgeführt.",
                    "Testing is carried out within the stated timeframe once your sample arrives."
                  )}
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={320}>
              <div className="space-y-4">
                <div className="text-2xl font-semibold text-slate-900">{tr("Lizenzgebühren", "License fees")}</div>
                <p className="text-slate-600 max-w-3xl text-lg leading-relaxed">
                  {tr(
                    "Lizenzgebühren fallen erst nach Annahme des Siegels und Vorlage der Prüfergebnisse an.",
                    "License fees only start after the seal is approved and your test results are ready."
                  )}
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={380}>
              <div className="space-y-8">
                <div className="text-2xl font-semibold text-slate-900">
                  {tr("4. Lizenzplan auswählen und Siegel erhalten", "4. Choose a license plan and receive your seal")}
                </div>
                {planNotice && <p className="text-sm text-amber-700">{planNotice}</p>}
                <div className="grid gap-6 md:grid-cols-3 pt-4">
                  {plans.map((plan, i) => (
                    <div
                      key={plan.name}
                      className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white/90 p-7 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="space-y-3">
                        <div className="text-lg font-semibold text-slate-900">{plan.name}</div>
                        <div className="text-base font-medium text-slate-700">{tr(plan.price.de, plan.price.en)}</div>
                        <p className="text-sm text-slate-500 leading-relaxed">{tr(plan.detail.de, plan.detail.en)}</p>
                      </div>
                      <Link
                        href={plan.href}
                        onClick={handlePlanClick}
                        aria-disabled={!(productStatus && isPaid && isPassed)}
                        title={!(productStatus && isPaid && isPassed) ? planDisabledTitle : undefined}
                        className={`mt-8 inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
                          productStatus && isPaid && isPassed
                            ? "bg-slate-900 text-white hover:bg-black"
                            : "bg-slate-200 text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        {tr("Lizenzplan wählen", "Select plan")}
                        <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>

        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50/80">
        <FadeIn delay={450}>
          <div className="mx-auto max-w-6xl px-6 py-18 md:py-20 space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-slate-900">{tr("Mach dein Listing sichtbar", "Make your listing stand out")}</h2>
              <p className="text-slate-600 max-w-2xl text-lg leading-relaxed">
                {tr(
                  "Spare Werbebudget gezielt und steigere deine Conversion Rate um bis zu 90 %.",
                  "Use your ad budget efficiently and raise your conversion rate by up to 90%."
                )}
              </p>
            </div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl transition-transform duration-700 hover:scale-[1.01]">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src="/images/amazonsiegel.png"
                  alt={tr("Listing mit Testsieger-Siegel", "Listing with Testsieger seal")}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1280px) 1100px, (min-width: 768px) 80vw, 100vw"
                />
              </div>
            </div>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}
