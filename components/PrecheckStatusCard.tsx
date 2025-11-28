"use client";

import { useLocale } from "@/components/LocaleProvider";
import ProductPayButton from "@/app/dashboard/ProductPayButton";
import { usePrecheckStatusData, ProductStatusPayload } from "@/hooks/usePrecheckStatusData";

type Props = {
  state: ReturnType<typeof usePrecheckStatusData>;
  className?: string;
};

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

export function PrecheckStatusCard({ state, className = "" }: Props) {
  const { locale } = useLocale();
  const tr = (de: string, en: string) => (locale === "en" ? en : de);
  const { products, selectedProductId, setSelectedProductId, productStatus, productsLoading, statusLoading, statusError } = state;

  const stage = deriveStage(productStatus);
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
    { key: "COMPLETION", percent: 80, label: tr("Completion", "Completion"), helper: tr("Bericht wird erstellt", "Report is being finalised") },
    { key: stage.key, percent: 100, label: finalLabel, helper: finalHelper },
  ];

  const activePercent = Math.min(stage.percent, 100);
  const errorMessage =
    statusError === "UNAUTHORIZED"
      ? tr("Bitte melden Sie sich an, um den Status zu sehen.", "Please sign in to view your status.")
      : statusError === "LOAD_FAILED"
      ? tr("Status konnte nicht geladen werden.", "Could not load status.")
      : null;

  return (
    <div className={`overflow-visible rounded-3xl border border-slate-100/70 bg-white/80 p-6 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.45)] ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">{tr("Fortschritt", "Progress")}</p>
          <div className="text-xl font-semibold text-slate-900">{tr("Status deiner Prüfung", "Your review status")}</div>
          {productStatus?.name && (
            <p className="text-sm text-slate-600">
              {tr("Produkt", "Product")}: <span className="font-semibold text-slate-800">{productStatus.name}</span>
            </p>
          )}
          {errorMessage && <p className="text-sm text-rose-600">{errorMessage}</p>}
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
  );
}
