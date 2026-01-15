"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { useEffect, useState, useRef } from "react";
import { usePrecheckStatusData } from "@/hooks/usePrecheckStatusData";

// --- Types ---
type TestOption = {
  id: string;
  title: { de: string; en: string };
  price: { de: string; en: string };
  timeline: { de: string; en: string };
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

// --- Data ---
const STANDARD_NET_EUR = 254;
const PRIORITY_NET_EUR = 318;
const VAT_RATE = 0.19;

const testOptions: TestOption[] = [
  {
    id: "standard",
    title: { de: "Produkttest Checkout", en: "Product test checkout" },
    price: { de: "254,00 € zzgl. MwSt.", en: "€254 plus VAT" },
    timeline: { de: "14–17 Werktage nach Erhalt", en: "14–17 business days after receipt" },
  },
  {
    id: "priority",
    title: { de: "Produkttest Priority", en: "Product test priority" },
    price: { de: "(254 € + 64 €) zzgl. MwSt.", en: "(€254 + €64) plus VAT" },
    timeline: { de: "4–7 Werktage nach Erhalt", en: "4–7 business days after receipt" },
  },
];

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
  const checkout = searchParams?.get("checkout") || "";
  const productNameFromQuery = searchParams?.get("product") || "";
  const statusState = usePrecheckStatusData({ initialProductId: productId });
  const refreshStatus = statusState.refresh;
  const { productStatus } = statusState;
  const { products, setProducts, selectedProductId, setSelectedProductId, productsLoading, statusError } = statusState;
  const isUnauthorized = statusError === "UNAUTHORIZED";
  const search = searchParams?.toString();
  const nextAfterLogin = encodeURIComponent(`/precheck${search ? `?${search}` : ""}`);
  const [payError, setPayError] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [heroStage, setHeroStage] = useState<"loading" | "done">("loading");
  const [dots, setDots] = useState(0);
  const [heroSeen, setHeroSeen] = useState(false);
  const [paymentConfirming, setPaymentConfirming] = useState(false);
  const [paymentConfirmTimedOut, setPaymentConfirmTimedOut] = useState(false);
  const [showInlinePrecheck, setShowInlinePrecheck] = useState(false);
  const [inlinePrecheckMounted, setInlinePrecheckMounted] = useState(false);
  const [inlineSubmitMessage, setInlineSubmitMessage] = useState<string | null>(null);
  const [inlineSubmitting, setInlineSubmitting] = useState(false);
  const [inlineProduct, setInlineProduct] = useState({
    productName: "",
    brand: "",
    category: "",
    code: "",
    specs: "",
    size: "",
    madeIn: "",
    material: "",
  });
  const heroTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dotsTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const inlinePrecheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkoutRef = useRef<HTMLDivElement | null>(null);

  const isPaid = productStatus ? ["PAID", "MANUAL"].includes(productStatus.paymentStatus) : false;
  const paidCount = products.filter((p) => ["PAID", "MANUAL"].includes(p.paymentStatus)).length;
  const unpaidCount = products.filter((p) => p.paymentStatus === "UNPAID").length;
  const productDiscountPercent = Number(productStatus?.precheckDiscountPercent ?? 0) || 0;
  const basePriceDiscountPercent = productDiscountPercent || Math.min(30, Math.max(0, paidCount * 10));
  const priceDiscountPercent = Math.max(0, Math.min(30, basePriceDiscountPercent));
  const hasPriceDiscount = priceDiscountPercent > 0;
  const bundleDiscountPercent = unpaidCount >= 3 ? 30 : unpaidCount === 2 ? 20 : 0;
  const hasBundleDiscount = bundleDiscountPercent > 0;
  const displayDiscountPercent = hasBundleDiscount ? bundleDiscountPercent : priceDiscountPercent;
  const discountProductCount = hasBundleDiscount ? unpaidCount : 1;
  const showCtaDiscount = displayDiscountPercent > 0;
  const upsellDiscountPercent = priceDiscountPercent > 0 ? priceDiscountPercent : 30;
  const displayProductName = (productStatus?.name || productNameFromQuery).trim();
  const productLabel = displayProductName || tr("dein Produkt", "your product");
  const formatEur = (amountEur: number) =>
    new Intl.NumberFormat(locale === "en" ? "en-GB" : "de-DE", { style: "currency", currency: "EUR" }).format(amountEur);
  const roundEur = (n: number) => Math.round(n * 100) / 100;
  const discountedNet = (netEur: number) => roundEur(netEur * (1 - priceDiscountPercent / 100));
  const discountedGross = (netEur: number) => roundEur(discountedNet(netEur) * (1 + VAT_RATE));
  const discountSavings = (netEur: number) =>
    roundEur(netEur * (displayDiscountPercent / 100) * discountProductCount);
  const standardNetLabel = `${formatEur(discountedNet(STANDARD_NET_EUR))}`;
  const priorityNetLabel = `${formatEur(discountedNet(PRIORITY_NET_EUR))}`;
  const heroHeading =
    isUnauthorized
      ? tr("Pre-Check nicht möglich. Bitte melde dich an.", "Pre-check unavailable. Please sign in.")
    : isPaid
      ? tr("Zahlung bestätigt.", "Payment confirmed.")
    : checkout === "success" && !isPaid
        ? `${tr("Zahlung wird bestätigt", "Confirming payment")}${".".repeat((dots % 3) + 1)}`
        : heroStage === "loading"
          ? `${tr("Pre-Check", "Pre-check")}${".".repeat((dots % 3) + 1)}`
          : tr("Pre-Check bestanden!", "Pre-check passed!");
  const handlePayClick = async (optionId: string) => {
    if (isUnauthorized) {
      setPayError(tr("Bitte melde dich an, um die Zahlung zu starten.", "Please sign in to start payment."));
      router.push(`/login?next=${nextAfterLogin}`);
      return;
    }
    if (!productStatus) {
      setPayError(tr("Bitte zuerst ein Produkt auswählen oder Pre-Check einreichen.", "Please select a product or submit a pre-check first."));
      return;
    }
    if (isPaid) {
      setPayError(tr("Bereits bezahlt.", "Already paid."));
      return;
    }
    setPayError(null);
    setPaying(optionId);
    try {
      const res = await fetch("/api/precheck/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: productStatus.id, option: optionId }),
      });
      const data = await res.json();
      if (res.status === 401) {
        setPayError(tr("Bitte einloggen, um die Zahlung zu starten.", "Please sign in to start payment."));
        router.push(`/login?next=${nextAfterLogin}`);
        return;
      }
      if (!res.ok) {
        setPayError(data?.error || tr("Zahlung konnte nicht gestartet werden.", "Could not start payment."));
        return;
      }
      if (data?.alreadyPaid) {
        setPayError(tr("Bereits bezahlt.", "Already paid."));
        return;
      }
      if (data?.url) {
        window.location.href = data.url as string;
      }
    } catch (err) {
      setPayError(tr("Zahlung konnte nicht gestartet werden.", "Could not start payment."));
    } finally {
      setPaying(null);
    }
  };

  const openInlinePrecheck = () => {
    if (!inlinePrecheckMounted) {
      setInlinePrecheckMounted(true);
      requestAnimationFrame(() => {
        setShowInlinePrecheck(true);
      });
      return;
    }
    setShowInlinePrecheck(true);
  };

  const closeInlinePrecheck = () => {
    setShowInlinePrecheck(false);
  };

  const toggleInlinePrecheck = () => {
    if (showInlinePrecheck) {
      closeInlinePrecheck();
    } else {
      openInlinePrecheck();
    }
  };

  const handleInlinePrecheckSubmit = async () => {
    setInlineSubmitMessage(null);
    const requiredFields = [
      { key: "productName", label: tr("Produktname", "Product name"), min: 2 },
      { key: "brand", label: tr("Marke", "Brand"), min: 1 },
      { key: "category", label: tr("Kategorie", "Category"), min: 1 },
      { key: "code", label: tr("Artikelnummer", "Item code"), min: 2 },
      { key: "specs", label: tr("Spezifikationen", "Specs"), min: 5 },
      { key: "size", label: tr("Größe / Maße", "Size"), min: 2 },
      { key: "madeIn", label: tr("Hergestellt in", "Made in"), min: 2 },
      { key: "material", label: tr("Material", "Material"), min: 2 },
    ] as const;
    for (const field of requiredFields) {
      const value = (inlineProduct as Record<string, string>)[field.key] || "";
      if (value.trim().length < field.min) {
        setInlineSubmitMessage(tr(`Bitte ${field.label} ausfüllen.`, `Please enter ${field.label}.`));
        return;
      }
    }
    setInlineSubmitting(true);
    try {
      const payload = {
        productName: inlineProduct.productName.trim(),
        brand: inlineProduct.brand.trim(),
        category: inlineProduct.category.trim(),
        code: inlineProduct.code.trim(),
        specs: inlineProduct.specs.trim(),
        size: inlineProduct.size.trim(),
        madeIn: inlineProduct.madeIn.trim(),
        material: inlineProduct.material.trim(),
      };
      const res = await fetch("/api/products/quick-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setInlineSubmitMessage(tr("Bitte einloggen, um fortzufahren.", "Please sign in to continue."));
        router.push(`/login?next=${nextAfterLogin}`);
        return;
      }
      if (!res.ok || !data?.product) {
        setInlineSubmitMessage(data?.error || tr("Produkt konnte nicht angelegt werden.", "Product could not be created."));
        return;
      }
      const paidCount = products.filter((p) => ["PAID", "MANUAL"].includes(p.paymentStatus)).length;
      const nextDiscountPercent = Math.min(30, Math.max(0, paidCount * 10));
      const nextProduct = {
        id: data.product.id as string,
        name: data.product.name as string,
        brand: data.product.brand ?? null,
        paymentStatus: (data.product.paymentStatus as "UNPAID" | "PAID" | "MANUAL") || "UNPAID",
        adminProgress: (data.product.adminProgress as "PRECHECK" | "RECEIVED" | "ANALYSIS" | "COMPLETION" | "PASS" | "FAIL") || "PRECHECK",
        status: (data.product.status as string) || "PRECHECK",
        createdAt: data.product.createdAt as string | undefined,
        precheckDiscountPercent: nextDiscountPercent,
      };
      setProducts((prev) => [nextProduct, ...prev]);
      setSelectedProductId(nextProduct.id);
      setInlineSubmitMessage(tr("Produkt angelegt.", "Product created."));
      setInlineProduct({
        productName: "",
        brand: "",
        category: "",
        code: "",
        specs: "",
        size: "",
        madeIn: "",
        material: "",
      });
    } catch {
      setInlineSubmitMessage(tr("Produkt konnte nicht angelegt werden.", "Product could not be created."));
    } finally {
      setInlineSubmitting(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasProduct = Boolean(productStatus?.id);
    const isCoarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

    // clear any existing timer when dependencies change
    if (heroTimer.current) {
      clearTimeout(heroTimer.current);
      heroTimer.current = null;
    }

    if (isUnauthorized) {
      setHeroStage("done");
      setHeroSeen(true);
      return;
    }

    // If no logged-in product context, keep loading forever
    if (!hasProduct) {
      setHeroStage("loading");
      setHeroSeen(false);
      return;
    }

    const hasSeen = sessionStorage.getItem("precheckHeroSeen") === "1";

    if (isCoarse) {
      setHeroStage("done");
      setHeroSeen(true);
      sessionStorage.setItem("precheckHeroSeen", "1");
      return;
    }

    if (hasSeen) {
      setHeroSeen(true);
      setHeroStage("done");
      return;
    }

    setHeroSeen(false);
    heroTimer.current = setTimeout(() => {
      setHeroStage("done");
      setHeroSeen(true);
      sessionStorage.setItem("precheckHeroSeen", "1");
    }, 3000);

    return () => {
      if (heroTimer.current) clearTimeout(heroTimer.current);
    };
  }, [isUnauthorized, productStatus]);

  useEffect(() => {
    const shouldAnimateDots = (heroStage === "loading" || paymentConfirming) && !isUnauthorized;
    if (!shouldAnimateDots) {
      if (dotsTimer.current) {
        clearInterval(dotsTimer.current);
        dotsTimer.current = null;
      }
      return;
    }
    dotsTimer.current = setInterval(() => {
      setDots((d) => (d + 1) % 3);
    }, 500);
    return () => {
      if (dotsTimer.current) clearInterval(dotsTimer.current);
    };
  }, [heroStage, isUnauthorized, paymentConfirming]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isUnauthorized) {
      setPaymentConfirming(false);
      setPaymentConfirmTimedOut(false);
      return;
    }
    if (checkout !== "success") {
      setPaymentConfirming(false);
      setPaymentConfirmTimedOut(false);
      return;
    }
    if (isPaid) {
      setPaymentConfirming(false);
      setPaymentConfirmTimedOut(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const startedAt = Date.now();
    const maxMs = 60_000;
    const intervalMs = 2_000;

    setPaymentConfirming(true);
    setPaymentConfirmTimedOut(false);

    const tick = async () => {
      if (cancelled) return;
      try {
        await refreshStatus({ signal: controller.signal });
      } catch {
        // ignore, we retry below
      }
      if (cancelled) return;
      if (Date.now() - startedAt >= maxMs) {
        setPaymentConfirming(false);
        setPaymentConfirmTimedOut(true);
        return;
      }
      timer = setTimeout(tick, intervalMs);
    };

    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      controller.abort();
    };
  }, [checkout, isPaid, isUnauthorized, refreshStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (checkout !== "success") return;
    if (!isPaid) return;
    if (!searchParams) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("checkout");
    router.replace(`/precheck?${params.toString()}`);
  }, [checkout, isPaid, router, searchParams]);

  useEffect(() => {
    if (isUnauthorized) {
      setShowInlinePrecheck(false);
    }
  }, [isUnauthorized]);

  useEffect(() => {
    if (showInlinePrecheck) {
      if (inlinePrecheckTimer.current) {
        clearTimeout(inlinePrecheckTimer.current);
        inlinePrecheckTimer.current = null;
      }
      return;
    }
    if (!inlinePrecheckMounted) return;
    inlinePrecheckTimer.current = setTimeout(() => {
      setInlinePrecheckMounted(false);
      inlinePrecheckTimer.current = null;
    }, 300);
    return () => {
      if (inlinePrecheckTimer.current) {
        clearTimeout(inlinePrecheckTimer.current);
        inlinePrecheckTimer.current = null;
      }
    };
  }, [showInlinePrecheck, inlinePrecheckMounted]);

  // Removed auto-scroll to avoid disrupting mobile keyboards

  return (
    <main className="text-slate-900 font-sans" style={{ backgroundColor: '#EEF4ED' }}>
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
                  {checkout === "success" && !isPaid && !isUnauthorized ? (
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" aria-hidden />
                      {tr("Zahlung wird bestätigt …", "Confirming payment …")}
                    </div>
                  ) : heroStage === "loading" && !isPaid && !isUnauthorized ? (
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" aria-hidden />
                      {tr("Lädt Ergebnis …", "Loading result …")}
                    </div>
                  ) : null}
                  {isUnauthorized ? (
                    <>
                      <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                        {tr(
                          "Bitte melde dich an, um deinen Pre-Check einzusehen und fortzufahren.",
                          "Please sign in to view your pre-check and continue."
                        )}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/login?next=${nextAfterLogin}`}
                          className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
                        >
                          {tr("Einloggen", "Sign in")}
                        </Link>
                      </div>
                    </>
                  ) : isPaid ? (
                    <>
                      <p className="text-lg md:text-xl font-medium text-slate-800">
                        {tr("Danke für deine Zahlung!", "Thanks for your payment!")}
                      </p>
                      <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                        {tr(
                          `Wir haben die Grundgebühr für „${productLabel}“ erhalten. Als Nächstes bekommst du per E-Mail Rechnung und Versandadresse. Bitte sende dein Produkt an uns, damit wir mit der Prüfung starten können.`,
                          `We’ve received the base fee for “${productLabel}”. Next, you’ll receive the invoice and shipping address by email. Please send your product to us so we can start testing.`
                        )}
                      </p>
                    </>
                  ) : checkout === "success" && !isPaid ? (
                    <>
                      <p className="text-lg md:text-xl font-medium text-slate-800">
                        {tr("Wir prüfen den Zahlungseingang …", "We’re confirming your payment …")}
                      </p>
                      <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                        {tr(
                          "Das dauert meist nur ein paar Sekunden. Diese Seite aktualisiert sich automatisch.",
                          "This usually takes a few seconds. This page will update automatically."
                        )}
                      </p>
                      {paymentConfirmTimedOut && (
                        <p className="text-sm text-amber-700">
                          {tr(
                            "Das dauert länger als erwartet. Bitte lade die Seite neu oder versuche es in einer Minute erneut.",
                            "This is taking longer than expected. Please refresh the page or try again in a minute."
                          )}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-lg md:text-xl font-medium text-slate-800">
                        {tr("Produkt jetzt an uns senden.", "Send your product to us now.")}
                      </p>
                      <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                        <strong>
                          {tr(
                            `Hierfür fällt einmalig eine Testgebühr ab ${standardNetLabel} zzgl. MwSt. an.`,
                            `A one-time test fee starting at ${standardNetLabel} plus VAT is due.`
                          )}
                        </strong>{" "}
                        {tr(
                          "Nach Bezahlung senden wir eine E-Mail mit Rechnung und Versandadresse.",
                          "After payment we will email your invoice and the shipping address."
                        )}
                      </p>
                      {hasPriceDiscount && (
                        <p className="text-sm text-emerald-700 font-semibold">
                          {tr(
                            `Du erhältst ${priceDiscountPercent}% Rabatt auf die Grundgebühr für dieses Produkt.`,
                            `You get ${priceDiscountPercent}% off the base fee for this product.`
                          )}
                        </p>
                      )}
                    </>
                  )}
                </div>
                {!isUnauthorized && (
                  <div className="inline-flex items-center gap-3 rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-semibold tracking-[0.18em] w-fit shadow-md">
                    {tr("Nächster Schritt: Überprüfen Sie Ihren E-Mail-Posteingang", "Next step: Check your email inbox")}
                  </div>
                )}
              </div>

              <div className="relative shrink-0 w-40 h-40 md:w-56 md:h-56 lg:w-64 lg:h-64 self-center rounded-3xl bg-gradient-to-b from-white to-slate-50 p-3 flex items-center justify-center">
                <Image
                  src="/siegel19.png"
                  alt={tr("Testsieger Siegel", "Testsieger seal")}
                  fill
                  className="object-contain object-center drop-shadow-2xl transition-transform duration-500 hover:scale-105"
                  priority
                />
              </div>
            </div>
          </FadeIn>

          <div className="space-y-16 md:space-y-18">
            <FadeIn delay={180}>
              <div className="space-y-3" id="checkout-options" ref={checkoutRef}>
                <div className="text-2xl font-semibold text-slate-900">
                  {tr("2. Produkt jetzt an uns senden", "2. Send your product to us now")}
                </div>
                <p className="text-slate-600 max-w-3xl leading-relaxed text-lg">
                  {tr(
                    "Wählen Sie den passenden Prüflauf und schließen Sie den Checkout ab, damit wir Versandadresse und Rechnung bereitstellen können.",
                    "Choose the processing speed and complete checkout so we can provide shipping details and your invoice."
                  )}
                </p>

                <div className="mt-8 flex justify-center items-start">
                  <div
                    id="discount-upsell"
                    className={`w-full rounded-3xl p-6 md:p-7 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.7)] ring-1 ring-white/10 ${
                      showInlinePrecheck ? "max-w-5xl h-auto min-h-0" : "max-w-4xl"
                    }`}
                    style={{
                      background: "linear-gradient(90deg, #020617 0%, #1e3a8a 52%, #0f172a 100%)",
                      opacity: 1,
                      filter: "none",
                    }}
                  >
                    <div className="relative overflow-hidden rounded-3xl">
                      <div className="relative isolate rounded-3xl px-6 py-7 text-center text-white ring-1 ring-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:px-10 md:py-8">
                        <div className="flex flex-col gap-6">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/70">
                              {tr("Produkt auswählen & Grundgebühr zahlen", "Select product & pay base fee")}
                            </p>
                            <div className="text-base md:text-lg font-semibold tracking-tight">
                              {tr("Rabatt auf jede weitere Grundgebühr", "Discount on every additional base fee")}
                            </div>
                            <p className="mx-auto max-w-2xl text-sm md:text-base text-white/85 leading-relaxed">
                              {tr(
                                `Reiche jetzt weitere Produkte ein und sichere dir automatisch bis zu 30% Rabatt auf die Grundgebühr pro Produkt. So kommst du schneller zum nächsten Schritt Richtung Prüfsiegel, mit spürbar geringeren Kosten pro Prüfung.`,
                                `Submit more products now and automatically secure up to 30% off the base fee per product. This gets you to the next step towards the seal faster with noticeably lower costs per test.`
                              )}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-left">
                            {productsLoading && (
                              <p className="text-sm text-white/80">{tr("Lade Produkte…", "Loading products…")}</p>
                            )}
                            {statusError === "UNAUTHORIZED" && (
                              <p className="text-sm text-amber-200">
                                {tr("Bitte einloggen, um Produkte zu sehen.", "Please sign in to view your products.")}
                              </p>
                            )}
                            {statusError === "LOAD_FAILED" && (
                              <p className="text-sm text-rose-200">
                                {tr("Produkte konnten nicht geladen werden.", "Could not load products.")}
                              </p>
                            )}
                            {!productsLoading && statusError === null && products.length === 0 && (
                              <p className="text-sm text-white/80">
                                {tr("Noch keine Produkte angelegt. Bitte zuerst ein Produkt einreichen.", "No products yet. Please submit a product first.")}
                              </p>
                            )}
                            {products.length > 0 && (
                              <div className="flex flex-col gap-2">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                  <select
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                    className="w-full rounded-xl border border-white/20 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm md:flex-1"
                                  >
                                    <option value="">{tr("Bitte wählen", "Please choose")}</option>
                                    {products.map((p) => {
                                      const paid = ["PAID", "MANUAL"].includes(p.paymentStatus);
                                      const pDiscount = Math.max(0, Math.min(30, Number(p.precheckDiscountPercent ?? 0) || 0));
                                      const date = p.paidAt
                                        ? new Date(p.paidAt).toLocaleDateString(locale === "en" ? "en-GB" : "de-DE", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                          })
                                        : "";
                                      return (
                                        <option key={p.id} value={p.id} disabled={paid}>
                                          {p.name} {p.brand ? `– ${p.brand}` : ""}{" "}
                                          {paid
                                            ? `(${tr("Bezahlt", "Paid")}${date ? ` · ${date}` : ""})`
                                            : pDiscount > 0
                                              ? `(${pDiscount}% ${tr("Rabatt", "off")})`
                                              : ""}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  {!isUnauthorized && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setInlineSubmitMessage(null);
                                        toggleInlinePrecheck();
                                      }}
                                      aria-expanded={showInlinePrecheck}
                                      aria-controls="inline-precheck"
                                      className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
                                    >
                                      {tr("Weitere Produkte einreichen", "Submit more products")}
                                    </button>
                                  )}
                                </div>
                                {!selectedProductId && (
                                  <p className="text-xs text-amber-200">
                                    {tr("Bitte Produkt auswählen, um die Grundgebühr zu zahlen.", "Select a product to pay the base fee.")}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex flex-wrap justify-center gap-3 md:justify-end">
                              {isUnauthorized ? (
                                <>
                                  <Link
                                    href={`/login?next=${nextAfterLogin}`}
                                    className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
                                  >
                                    {tr("Einloggen & Rabatt sichern", "Sign in to secure discount")}
                                  </Link>
                                  <Link
                                    href="/produkte/produkt-test?precheck=open#precheck"
                                    className="rounded-full border border-white/30 bg-white/0 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-white/10"
                                  >
                                    {tr("Zum Produkt Test", "Go to product test")}
                                  </Link>
                                </>
                              ) : products.length === 0 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInlineSubmitMessage(null);
                                    toggleInlinePrecheck();
                                  }}
                                  aria-expanded={showInlinePrecheck}
                                  aria-controls="inline-precheck"
                                  className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
                                >
                                  {tr("Weitere Produkte einreichen", "Submit more products")}
                                </button>
                              ) : null}
                            </div>

                            {!isUnauthorized && inlinePrecheckMounted && (
                              <div
                                id="inline-precheck"
                                className={`overflow-hidden transition-[max-height,opacity,margin] duration-300 ease-in-out ${
                                  showInlinePrecheck
                                    ? "max-h-[1200px] opacity-100 pointer-events-auto mt-4"
                                    : "max-h-0 opacity-0 pointer-events-none mt-0"
                                }`}
                                aria-hidden={!showInlinePrecheck}
                              >
                                <fieldset
                                  disabled={!showInlinePrecheck}
                                  className="rounded-2xl border border-white/15 bg-white/95 p-5 text-slate-900 shadow-sm"
                                >
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <input
                                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                                      placeholder={tr("Produktname", "Product name")}
                                      value={inlineProduct.productName}
                                      onChange={(e) => setInlineProduct((p) => ({ ...p, productName: e.target.value }))}
                                    />
                                    <input
                                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                                      placeholder={tr("Marke", "Brand")}
                                      value={inlineProduct.brand}
                                      onChange={(e) => setInlineProduct((p) => ({ ...p, brand: e.target.value }))}
                                    />
                                    <select
                                      value={inlineProduct.category}
                                      onChange={(e) => setInlineProduct((p) => ({ ...p, category: e.target.value }))}
                                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                                    >
                                      <option value="">{tr("Nichts ausgewählt", "Nothing selected")}</option>
                                      <option value="Ausbildung">Ausbildung</option>
                                      <option value="Auto & Motorrad">Auto &amp; Motorrad</option>
                                      <option value="Baby">Baby</option>
                                      <option value="Baumarkt">Baumarkt</option>
                                      <option value="Beleuchtung">Beleuchtung</option>
                                      <option value="Bücher">Bücher</option>
                                      <option value="Bürobedarf & Schreibwaren">Bürobedarf &amp; Schreibwaren</option>
                                      <option value="Computer & Zubehör">Computer &amp; Zubehör</option>
                                      <option value="DVD & Blu-ray">DVD &amp; Blu-ray</option>
                                      <option value="Elektro-Großgeräte">Elektro-Großgeräte</option>
                                      <option value="Elektronik & Foto">Elektronik &amp; Foto</option>
                                      <option value="Garten">Garten</option>
                                      <option value="Gewerbe, Industrie & Wissenschaft">Gewerbe, Industrie &amp; Wissenschaft</option>
                                      <option value="Handgefertigte Produkte">Handgefertigte Produkte</option>
                                      <option value="Haustierbedarf">Haustierbedarf</option>
                                      <option value="Kamera & Foto">Kamera &amp; Foto</option>
                                      <option value="Kosmetik & Pflege">Kosmetik &amp; Pflege</option>
                                      <option value="Küche, Haushalt & Wohnen">Küche, Haushalt &amp; Wohnen</option>
                                      <option value="Lebensmittel & Getränke">Lebensmittel &amp; Getränke</option>
                                      <option value="Mode">Mode</option>
                                      <option value="Musikinstrumente & DJ-Equipment">Musikinstrumente &amp; DJ-Equipment</option>
                                      <option value="Software">Software</option>
                                      <option value="Spiele & Gaming">Spiele &amp; Gaming</option>
                                      <option value="Spielzeug">Spielzeug</option>
                                      <option value="Sport & Freizeit">Sport &amp; Freizeit</option>
                                      <option value="Uhren & Schmuck">Uhren &amp; Schmuck</option>
                                      <option value="Wohnen">Wohnen</option>
                                    </select>
                                    <input
                                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                                      placeholder={tr("Artikelnummer", "Item code")}
                                      value={inlineProduct.code}
                                      onChange={(e) => setInlineProduct((p) => ({ ...p, code: e.target.value }))}
                                    />
                                    <input
                                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 md:col-span-2"
                                      placeholder={tr("Spezifikationen", "Specs")}
                                      value={inlineProduct.specs}
                                      onChange={(e) => setInlineProduct((p) => ({ ...p, specs: e.target.value }))}
                                    />
                                    <input
                                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                                      placeholder={tr("Größe / Maße", "Size")}
                                      value={inlineProduct.size}
                                      onChange={(e) => setInlineProduct((p) => ({ ...p, size: e.target.value }))}
                                    />
                                    <input
                                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                                      placeholder={tr("Hergestellt in", "Made in")}
                                      value={inlineProduct.madeIn}
                                      onChange={(e) => setInlineProduct((p) => ({ ...p, madeIn: e.target.value }))}
                                    />
                                    <input
                                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 md:col-span-2"
                                      placeholder={tr("Material", "Material")}
                                      value={inlineProduct.material}
                                      onChange={(e) => setInlineProduct((p) => ({ ...p, material: e.target.value }))}
                                    />
                                    <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                                      <button
                                        type="button"
                                        onClick={handleInlinePrecheckSubmit}
                                        disabled={inlineSubmitting}
                                        className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black disabled:opacity-60"
                                      >
                                        {inlineSubmitting
                                          ? tr("Wird gesendet…", "Submitting…")
                                          : tr("Produkt einreichen", "Submit product")}
                                      </button>
                                      {inlineSubmitMessage && (
                                        <span className="text-sm text-slate-600">{inlineSubmitMessage}</span>
                                      )}
                                    </div>
                                  </div>
                                </fieldset>
                              </div>
                            )}

                            <div className="mt-3 text-center text-[11px] md:text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
                              {tr("Rabatt wird automatisch pro Produkt angewendet", "Discount is applied automatically per product")}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                {testOptions.map((option, idx) => {
                  const net = option.id === "priority" ? PRIORITY_NET_EUR : STANDARD_NET_EUR;
                  const bundleNet = roundEur(net * discountProductCount * (1 - displayDiscountPercent / 100));
                  const priceLabel = tr(
                    hasBundleDiscount
                      ? `${discountProductCount} Produkte: ${formatEur(bundleNet)} zzgl. MwSt.`
                      : `${formatEur(discountedNet(net))} zzgl. MwSt.`,
                    hasBundleDiscount
                      ? `${discountProductCount} products: ${formatEur(bundleNet)} plus VAT`
                      : `${formatEur(discountedNet(net))} plus VAT`
                  );
                  const savingsLabel = formatEur(discountSavings(net));
                  const isPriority = option.id === "priority";
                  const checkoutCtaClass =
                    "text-slate-900 shadow-lg shadow-amber-500/25 ring-1 ring-amber-200/70 group-hover:brightness-110";
                  const checkoutCtaStyle = {
                    backgroundImage: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 55%, #d97706 100%)",
                  };
                  const timelineClass = isPriority
                    ? "mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/95 shadow-sm ring-1 ring-emerald-200/40"
                    : "mt-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/85";
                  const timelineStyle = isPriority
                    ? { backgroundImage: "linear-gradient(135deg, #14532d 0%, #16a34a 55%, #4ade80 100%)" }
                    : undefined;
                  return (
                  <button
                    key={option.title.de}
                    type="button"
                    onClick={() => handlePayClick(option.id)}
                    disabled={isUnauthorized || isPaid || paying === option.id}
                    className={`group relative flex h-full flex-col items-center justify-between overflow-hidden rounded-3xl border border-white/15 px-8 py-10 text-center text-white shadow-[0_28px_80px_-45px_rgba(15,23,42,0.55)] ring-1 ring-slate-900/10 transition-all duration-300 ${
                      isUnauthorized || isPaid ? "opacity-70 cursor-not-allowed" : "hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-900/30"
                    }`}
                    style={{
                      backgroundImage: idx === 0
                        ? "linear-gradient(135deg, #0f172a 0%, #1e3a8a 52%, #2563eb 100%)"
                        : "linear-gradient(135deg, #111827 0%, #1d4ed8 50%, #2563eb 100%)",
                    }}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="text-xl font-semibold leading-tight tracking-tight">
                        {option.id === "priority" ? (
                          <>
                            {tr("Produkttest ", "Product test ")}
                            <span style={{ color: "#f97316" }}>Priority</span>
                          </>
                        ) : (
                          tr(option.title.de, option.title.en)
                        )}
                      </div>
                      <div className="text-base font-medium text-white/95">
                        {priceLabel}
                      </div>
                      <span className={timelineClass} style={timelineStyle}>
                        {tr(option.timeline.de, option.timeline.en)}
                      </span>
                      {showCtaDiscount && (
                        <div className="mt-3 inline-flex flex-col items-center gap-1 rounded-2xl bg-emerald-400/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90">
                          <span>{tr(`RABATT: ${displayDiscountPercent}%`, `DISCOUNT: ${displayDiscountPercent}%`)}</span>
                          <span>{tr(`ERSPARNISS: ${savingsLabel}`, `SAVINGS: ${savingsLabel}`)}</span>
                        </div>
                      )}
                    </div>

                    <div
                      className={`mt-7 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${checkoutCtaClass}`}
                      style={checkoutCtaStyle}
                    >
                      {isUnauthorized
                        ? tr("Bitte einloggen", "Please sign in")
                        : isPaid
                        ? tr("Bereits bezahlt", "Already paid")
                        : paying === option.id
                        ? tr("Starte Zahlung…", "Starting payment…")
                        : tr("Zum Checkout", "Go to checkout")}
                      <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </div>
                  </button>
                  );
                })}
              </div>
              {payError && <p className="text-sm text-amber-700">{payError}</p>}
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
                <div className="text-2xl font-semibold text-slate-900" id="license-plans">
                  {tr("4. Lizenzplan auswählen und Siegel erhalten", "4. Choose a license plan and receive your seal")}
                </div>
                <div className="grid gap-10 md:grid-cols-3 pt-6">
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
                  src="/images/amazonsiegel.jpeg"
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
