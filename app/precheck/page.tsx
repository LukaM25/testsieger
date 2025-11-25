"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { useEffect, useState, MouseEvent } from "react";
import ProductPayButton from "@/app/kundenportal/ProductPayButton";

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

type ProductStatusPayload = {
  id: string;
  name: string;
  paymentStatus: "UNPAID" | "PAID" | "MANUAL";
  adminProgress: "PRECHECK" | "RECEIVED" | "ANALYSIS" | "COMPLETION" | "PASS" | "FAIL";
  status: string;
  createdAt?: string;
  brand?: string | null;
  certificate?: { id: string; pdfUrl?: string | null } | null;
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
  const [products, setProducts] = useState<ProductStatusPayload[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(productId);
  const [productStatus, setProductStatus] = useState<ProductStatusPayload | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [planNotice, setPlanNotice] = useState<string | null>(null);

  useEffect(() => {
    const selected = products.find((p) => p.id === selectedProductId) || null;
    setProductStatus(selected);
  }, [selectedProductId, products]);

  const deriveStage = (product: ProductStatusPayload | null) => {
    if (!product) return { key: "PRECHECK", percent: 0 } as const;
    if (product.adminProgress === "FAIL") return { key: "FAIL", percent: 100 } as const;
    if (product.adminProgress === "PASS") return { key: "PASS", percent: 100 } as const;
    if (product.adminProgress === "COMPLETION") return { key: "COMPLETION", percent: 80 } as const;
    if (product.adminProgress === "ANALYSIS") return { key: "ANALYSIS", percent: 60 } as const;
    if (product.adminProgress === "RECEIVED") return { key: "RECEIVED", percent: 40 } as const;
    if (["PAID", "MANUAL"].includes(product.paymentStatus)) return { key: "WAITING_SHIPPING", percent: 20 } as const;
    return { key: "PRECHECK", percent: 0 } as const;
  };

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const loadProducts = async () => {
      setProductsLoading(true);
      setStatusLoading(true);
      setStatusError(null);
      try {
        const res = await fetch("/api/precheck/products", { cache: "no-store", signal: controller.signal });
        if (!res.ok) {
          if (!active) return;
          if (res.status === 401) {
            setStatusError(tr("Bitte melden Sie sich an, um den Status zu sehen.", "Please sign in to view your status."));
          } else {
            setStatusError(tr("Status konnte nicht geladen werden.", "Could not load status."));
          }
          setProducts([]);
          setProductStatus(null);
          return;
        }
        const data = await res.json();
        if (!active) return;
        const list = data.products || [];
        setProducts(list);
        if (productId && list.find((p: ProductStatusPayload) => p.id === productId)) {
          setSelectedProductId(productId);
          setProductStatus(list.find((p: ProductStatusPayload) => p.id === productId) || null);
        }
      } catch (err) {
        if (!active || controller.signal.aborted) return;
        setStatusError(tr("Status konnte nicht geladen werden.", "Could not load status."));
        setProducts([]);
        setProductStatus(null);
      } finally {
        if (active) {
          setProductsLoading(false);
          setStatusLoading(false);
        }
      }
    };
    loadProducts();
    return () => {
      active = false;
      controller.abort();
    };
    // only refetch when productId or locale changes (avoid re-run from inline tr function)
  }, [productId, locale]);

  const stage = deriveStage(productStatus);
  const hasPrecheck = products.length > 0;
  const isPaid = productStatus ? ["PAID", "MANUAL"].includes(productStatus.paymentStatus) : false;
  const isPassed = productStatus
    ? productStatus.adminProgress === "PASS" || productStatus.adminProgress === "COMPLETION" || productStatus.status === "COMPLETED"
    : false;
  const heroHeading = isPaid ? tr("Pre-Check bestanden", "Pre-check passed") : tr("Pre-Check erfolgreich", "Pre-check successful");
  const stageLabel = productStatus
    ? stage.key === "PASS"
      ? tr("Pass, Glückwunsch!", "Pass, congratulations!")
      : stage.key === "FAIL"
      ? tr("Fail, bitte E-Mail prüfen", "Fail, please check your email for possible solutions.")
      : stage.key === "COMPLETION"
      ? tr("Abschluss", "Completion")
      : stage.key === "ANALYSIS"
      ? tr("Analyse läuft", "Analysis in progress")
      : stage.key === "RECEIVED"
      ? tr("Wareneingang bestätigt", "Sample received")
      : stage.key === "WAITING_SHIPPING"
      ? tr("Warten auf Versand", "Waiting for shipping")
      : tr("Pre-Check", "Pre-check")
    : tr("Produkt auswählen", "Choose a product");

  const finalLabel =
    stage.key === "FAIL"
      ? tr("Fail, bitte E-Mail prüfen.", "Fail, please check your email for possible solutions.")
      : stage.key === "PASS"
      ? tr("Pass, Glückwunsch!", "Pass, congratulations!")
      : tr("Ergebnis ausstehend", "Result pending");
  const finalHelper =
    stage.key === "FAIL"
      ? tr("Wir haben Details per E-Mail gesendet.", "We sent details via email.")
      : stage.key === "PASS"
      ? tr("Zertifikat & Versand folgen.", "Certificate & shipping details follow.")
      : tr("Wir schließen den Bericht ab.", "We are finalising the report.");
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

  const steps = [
    {
      key: "PRECHECK",
      percent: 0,
      label: tr("Pre-Check", "Pre-check"),
      helper: tr("Formular eingereicht", "Form submitted"),
    },
    {
      key: "WAITING_SHIPPING",
      percent: 20,
      label: tr("Warten auf Versand", "Waiting for shipping"),
      helper: tr("Testgebühr bezahlt, Versand vorbereiten", "Test fee paid, prepare shipment"),
    },
    {
      key: "RECEIVED",
      percent: 40,
      label: tr("Eingang bestätigt", "Received"),
      helper: tr("Muster ist eingegangen", "Sample has arrived"),
    },
    {
      key: "ANALYSIS",
      percent: 60,
      label: tr("Analysis", "Analysis"),
      helper: tr("Tests laufen", "Testing in progress"),
    },
    {
      key: "COMPLETION",
      percent: 80,
      label: tr("Completion", "Completion"),
      helper: tr("Bericht wird erstellt", "Report is being finalised"),
    },
    {
      key: stage.key,
      percent: 100,
      label: finalLabel,
      helper: finalHelper,
    },
  ];

  const activePercent = Math.min(stage.percent, 100);

  return (
    <main className="bg-white text-slate-900 overflow-hidden font-sans">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_10%,#e0f2fe_0%,transparent_50%),radial-gradient(140%_90%_at_80%_-10%,#eef2ff_0%,transparent_55%)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-24 space-y-16">
          <FadeIn delay={100}>
            <div className="flex flex-col gap-10 rounded-3xl border border-slate-100/70 bg-white/80 p-8 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.45)] md:flex-row md:items-start md:justify-between md:p-10">
              <div className="space-y-6 max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
                  {tr("Ergebnis", "Result")}
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

          <ol className="space-y-14 md:space-y-16 list-decimal list-inside md:list-outside md:pl-6">
            <li className="space-y-8">
              <FadeIn delay={180}>
                <div className="space-y-3">
                  <div className="text-2xl font-semibold text-slate-900">
                    {tr("Produkt jetzt an uns senden", "Send your product to us now")}
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
            </li>

            <li className="space-y-4">
              <FadeIn delay={260}>
                <div className="text-2xl font-semibold text-slate-900">{tr("Produktprüfung", "Product testing")}</div>
                <p className="text-slate-600 max-w-3xl text-lg leading-relaxed">
                  {tr(
                    "Die Produktprüfung wird innerhalb des angegebenen Zeitraums nach Wareneingang durchgeführt.",
                    "Testing is carried out within the stated timeframe once your sample arrives."
                  )}
                </p>
              </FadeIn>
            </li>

            <li className="space-y-4">
              <FadeIn delay={320}>
                <div className="text-2xl font-semibold text-slate-900">{tr("Lizenzgebühren", "License fees")}</div>
                <p className="text-slate-600 max-w-3xl text-lg leading-relaxed">
                  {tr(
                    "Lizenzgebühren fallen erst nach Annahme des Siegels und Vorlage der Prüfergebnisse an.",
                    "License fees only start after the seal is approved and your test results are ready."
                  )}
                </p>
              </FadeIn>
            </li>

            <li className="space-y-8">
              <FadeIn delay={380}>
                <div className="text-2xl font-semibold text-slate-900">
                  {tr("Lizenzplan auswählen und Siegel erhalten", "Choose a license plan and receive your seal")}
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
              </FadeIn>
            </li>
          </ol>

          <FadeIn delay={430}>
            <div className="overflow-visible rounded-3xl border border-slate-100/70 bg-white/80 p-6 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.45)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
                    {tr("Fortschritt", "Progress")}
                  </p>
                  <div className="text-xl font-semibold text-slate-900">
                    {tr("Status deiner Prüfung", "Your review status")}
                  </div>
                  {productStatus?.name && (
                    <p className="text-sm text-slate-600">
                      {tr("Produkt", "Product")}: <span className="font-semibold text-slate-800">{productStatus.name}</span>
                    </p>
                  )}
                  {statusError && <p className="text-sm text-rose-600">{statusError}</p>}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm">
                  {statusLoading ? tr("Lädt Status…", "Loading status…") : stageLabel}
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr,1fr]">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-800">{tr("Produkt auswählen", "Choose a product")}</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    <option value="">{tr("Produkt wählen…", "Select a product…")}</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.brand ? `• ${p.brand}` : ""}
                      </option>
                    ))}
                  </select>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {products.map((p) => {
                      const checked = selectedProductId === p.id;
                      return (
                        <label
                          key={p.id}
                          className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm shadow-sm transition ${
                            checked ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                            checked={checked}
                            onChange={() => setSelectedProductId(checked ? "" : p.id)}
                          />
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-900">{p.name}</div>
                            <div className="text-xs text-slate-500">{p.brand || "—"}</div>
                            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                              {tr("Status", "Status")}: {p.adminProgress}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                    {!productsLoading && products.length === 0 && (
                      <p className="text-sm text-slate-600">
                        {tr("Bitte melden oder Pre-Check starten, um Produkte zu sehen.", "Sign in or submit a pre-check to see your products.")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm space-y-3">
                  <div className="text-sm font-semibold text-slate-900">{tr("Aktionen", "Actions")}</div>
                  {!productStatus && (
                    <p className="text-sm text-slate-600">
                      {tr("Wähle ein Produkt, um zu bezahlen oder das Zertifikat zu sehen.", "Select a product to pay or view the certificate.")}
                    </p>
                  )}
                  {productStatus && (
                    <>
                      <ProductPayButton
                        productId={productStatus.id}
                        status={productStatus.status}
                        paymentStatus={productStatus.paymentStatus}
                        forceEnabled
                      />
                      {productStatus.certificate?.pdfUrl ? (
                        <a
                          href={productStatus.certificate.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-white"
                        >
                          {tr("Zertifikat ansehen", "View certificate")}
                        </a>
                      ) : (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                          {tr("Zertifikat ausstehend", "Certificate pending")}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="relative mt-8 overflow-visible">
                <div className="relative h-12">
                  {steps.slice(0, -1).map((step, idx) => {
                    const next = steps[idx + 1];
                    const span = next.percent - step.percent || 1;
                    const filled = Math.min(Math.max(activePercent - step.percent, 0), span);
                    const filledPct = (filled / span) * 100;
                    return (
                      <div
                        key={`connector-${step.key}-${next.key}`}
                        className="absolute left-0 top-1/2 h-[6px] -translate-y-1/2"
                        style={{ left: `${step.percent}%`, width: `${span}%` }}
                      >
                        <div className="h-full w-full rounded-full bg-slate-200" />
                        <div
                          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-slate-900 via-blue-700 to-sky-400 transition-all duration-500"
                          style={{ width: `${filledPct}%` }}
                        />
                      </div>
                    );
                  })}

                  {steps.map((step, idx) => {
                    const isActive = activePercent >= step.percent;
                    return (
                      <div
                        key={`${step.key}-${step.percent}-${idx}`}
                        className="group absolute flex flex-col items-center gap-2"
                        style={{ left: `${step.percent}%`, top: "50%", transform: "translate(-50%, -50%)" }}
                      >
                        <div className="relative">
                          <div
                            className={`h-4 w-4 rounded-full border-2 shadow-sm transition-all duration-300 ${
                              isActive ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"
                            }`}
                          />
                          <div className="pointer-events-none absolute -left-20 top-6 w-44 rounded-lg border border-slate-200 bg-white p-2 text-[11px] text-slate-700 opacity-0 shadow-sm transition duration-200 group-hover:opacity-100">
                            <div className="text-xs font-semibold text-slate-900">{step.label}</div>
                            <div className="mt-0.5 text-[10px] text-slate-500 leading-snug">{step.helper}</div>
                          </div>
                        </div>
                        <span
                          className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                            isActive ? "text-slate-900" : "text-slate-400"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </FadeIn>
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
