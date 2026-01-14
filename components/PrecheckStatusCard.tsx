"use client";

import { useLocale } from "@/components/LocaleProvider";
import ProductPayButton from "@/app/dashboard/ProductPayButton";
import { usePrecheckStatusData, ProductStatusPayload } from "@/hooks/usePrecheckStatusData";
import { useProductStatusPoll } from "@/hooks/useProductStatusPoll";

type Props = {
  state: ReturnType<typeof usePrecheckStatusData>;
  className?: string;
};

const deriveStage = (product: ProductStatusPayload | null) => {
  if (!product) return { key: "PRECHECK", percent: 0 } as const;
  if (product.adminProgress === "FAIL") return { key: "FAIL", percent: 100 } as const;
  if (product.adminProgress === "COMPLETION") return { key: "COMPLETION", percent: 100 } as const;
  if (product.adminProgress === "PASS") return { key: "PASS", percent: 80 } as const;
  if (product.adminProgress === "ANALYSIS") return { key: "ANALYSIS", percent: 60 } as const;
  if (product.adminProgress === "RECEIVED") return { key: "RECEIVED", percent: 40 } as const;
  if (["PAID", "MANUAL"].includes(product.paymentStatus)) return { key: "WAITING_SHIPPING", percent: 20 } as const;
  return { key: "PRECHECK", percent: 0 } as const;
};

export function PrecheckStatusCard({ state, className = "" }: Props) {
  const { locale } = useLocale();
  const tr = (de: string, en: string) => (locale === "en" ? en : de);
  const { products, selectedProductId, setSelectedProductId, productStatus, productsLoading, statusLoading, statusError } = state;

  const isOptimistic = Boolean(productStatus?.id && productStatus.id.startsWith("tmp_"));
  const stage = deriveStage(productStatus);
  const stageLabel = isOptimistic
    ? tr("Produkt wird angelegt…", "Creating product…")
    : productStatus
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

  const passLabel = tr("Bestanden", "Pass");
  const passHelper = tr("Prüfung bestanden", "Review passed");
  const completionLabel = tr("Abschluss", "Completion");
  const completionHelper = tr("Alle Dateien sind versendet.", "All files have been sent.");
  const finalKey = stage.key === "FAIL" ? "FAIL" : "COMPLETION";
  const finalLabel =
    stage.key === "FAIL"
      ? tr("Fail, bitte E-Mail prüfen.", "Fail, please check your email for possible solutions.")
      : completionLabel;
  const finalHelper =
    stage.key === "FAIL"
      ? tr("Wir haben Details per E-Mail gesendet.", "We sent details via email.")
      : completionHelper;

  const steps = [
    { key: "PRECHECK", percent: 0, label: tr("Pre-Check", "Pre-check"), helper: tr("Formular eingereicht", "Form submitted") },
    {
      key: "WAITING_SHIPPING",
      percent: 20,
      label: tr("Warten auf Versand", "Waiting for shipping"),
      helper: tr("Testgebühr bezahlt, Versand vorbereiten", "Test fee paid, prepare shipment"),
    },
    { key: "RECEIVED", percent: 40, label: tr("Eingang bestätigt", "Received"), helper: tr("Muster ist eingegangen", "Sample has arrived") },
    { key: "ANALYSIS", percent: 60, label: tr("Analysis", "Analysis"), helper: tr("Tests laufen", "Testing in progress") },
    { key: "PASS", percent: 80, label: passLabel, helper: passHelper },
    { key: finalKey, percent: 100, label: finalLabel, helper: finalHelper },
  ];

  const activePercent = isOptimistic ? 0 : Math.min(stage.percent, 100);
  const statusBadgeLabel = steps.find((step) => step.key === stage.key)?.label ?? stageLabel;
  const showStatusBadge = Boolean(productStatus) && !isOptimistic && stage.key !== "PRECHECK";
  const errorMessage =
    statusError === "UNAUTHORIZED"
      ? tr("Bitte melden Sie sich an, um den Status zu sehen.", "Please sign in to view your status.")
      : statusError === "LOAD_FAILED"
      ? tr("Status konnte nicht geladen werden.", "Could not load status.")
      : null;

  return (
    <div className={`rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">{tr("Fortschritt", "Progress")}</p>
          <h2 className="text-2xl font-bold text-slate-900">{tr("Status deiner Prüfung", "Your review status")}</h2>
          {productStatus?.name && (
            <p className="text-sm text-slate-600">
              {tr("Produkt", "Product")}: <span className="font-semibold text-slate-900">{productStatus.name}</span>
            </p>
          )}
          {errorMessage && <p className="text-sm text-rose-600">{errorMessage}</p>}
        </div>
        <div className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm">
          {statusLoading ? tr("Lädt Status…", "Loading status…") : stageLabel}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr,1fr]">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">{tr("Produkt auswählen", "Choose a product")}</span>
            <span className="text-xs text-slate-500">{products.length || 0} {tr("Produkte", "products")}</span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {productsLoading
              ? Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-[68px] w-full animate-pulse rounded-xl border border-slate-200 bg-white px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-3 w-24 rounded bg-slate-200" />
                      <div className="h-3 w-12 rounded bg-slate-200" />
                    </div>
                    <div className="mt-2 h-3 w-32 rounded bg-slate-200" />
                  </div>
                ))
              : products.map((p) => {
                  const checked = selectedProductId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProductId(checked ? "" : p.id)}
                      className={`flex w-full flex-col items-start rounded-xl border px-3 py-2 text-left transition ${
                        checked ? "border-blue-500 bg-white shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">{p.name}</span>
                        <span className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${checked ? "text-blue-600" : "text-slate-500"}`}>
                          {p.adminProgress}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">{p.brand || "—"}</span>
                    </button>
                  );
                })}
            {!productsLoading && products.length === 0 && (
              <p className="text-sm text-slate-600">
                {tr("Bitte melden oder Pre-Check starten, um Produkte zu sehen.", "Sign in or submit a pre-check to see your products.")}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">{tr("Aktionen", "Actions")}</div>
          {!productStatus && (
            <p className="mt-2 text-sm text-slate-600">
              {tr("Wähle ein Produkt, um zu bezahlen oder das Zertifikat zu sehen.", "Select a product to pay or view the certificate.")}
            </p>
          )}
          {productStatus && isOptimistic ? (
            <p className="mt-2 text-sm text-slate-600">
              {tr("Bitte kurz warten, das Produkt wird gespeichert.", "Please wait a moment while we save your product.")}
            </p>
          ) : productStatus ? (
            <div className="mt-3 space-y-2">
              <ProductPayButton
                productId={productStatus.id}
                status={productStatus.status}
                paymentStatus={productStatus.paymentStatus}
                forceEnabled
              />
              <CertificateAction
                productId={productStatus.id}
                initialCertificate={productStatus.certificate}
                status={productStatus.status}
                paymentStatus={productStatus.paymentStatus}
                statusLabel={statusBadgeLabel}
                showStatusLabel={showStatusBadge}
                tr={tr}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">{tr("Prüfungsverlauf", "Review timeline")}</div>
          <div className="text-xs text-slate-500">{activePercent}%</div>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-slate-900 via-blue-700 to-sky-400 transition-all duration-500"
            style={{ width: `${activePercent}%` }}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {steps.map((step) => {
            const isActive = activePercent >= step.percent;
            return (
              <div
                key={step.key}
                className={`rounded-xl border px-3 py-2 text-xs transition ${
                  isActive ? "border-sky-200 bg-sky-50 shadow-sm" : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="font-semibold text-slate-900">{step.label}</div>
                <div className="mt-1 text-[11px] text-slate-500 leading-snug">{step.helper}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type CertificateActionProps = {
  productId: string;
  status: string;
  paymentStatus: ProductStatusPayload["paymentStatus"];
  initialCertificate: ProductStatusPayload["certificate"];
  statusLabel: string;
  showStatusLabel: boolean;
  tr: (de: string, en: string) => string;
};

function CertificateAction({
  productId,
  status,
  paymentStatus,
  initialCertificate,
  statusLabel,
  showStatusLabel,
  tr,
}: CertificateActionProps) {
  const isPaid = paymentStatus === "PAID" || paymentStatus === "MANUAL";
  const pollingEnabled = isPaid;
  const { data } = useProductStatusPoll(productId, { enabled: pollingEnabled, intervalMs: 8000 });

  const effectivePdf = data?.pdfUrl ?? initialCertificate?.pdfUrl ?? null;
  const effectiveStatus = data?.certificateStatus ?? null;

  if (effectivePdf) {
    return (
      <a
        href={effectivePdf}
        target="_blank"
        rel="noreferrer"
        className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
      >
        {tr("Zertifikat ansehen (PDF)", "View certificate (PDF)")}
      </a>
    );
  }

  const isGenerating = isPaid && (!effectiveStatus || effectiveStatus === "PENDING");

  const statusText = showStatusLabel
    ? statusLabel
    : isPaid
      ? tr("Prüfung wird vorbereitet.", "Review is being prepared.")
      : tr("Zertifikat nach Zahlung verfügbar.", "Certificate available after payment.");

  return (
    <span className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
      {isGenerating && (
        <svg className="h-4 w-4 animate-spin text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle className="opacity-25" cx="12" cy="12" r="10" />
          <path className="opacity-75" d="M4 12a8 8 0 018-8" />
        </svg>
      )}
      {statusText}
    </span>
  );
}
