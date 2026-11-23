import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Check, FileText, Search } from "lucide-react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { normalizeLocale } from "@/lib/i18n";
import LizenzenClient from "./LizenzenClient";
import { ensureSignedS3Url, signedS3Url } from "@/lib/s3";

async function signCertificateAssetUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  if (/^https?:\/\//i.test(url)) return ensureSignedS3Url(url);

  try {
    if (url.startsWith("s3://")) {
      const parsed = new URL(url);
      return signedS3Url(parsed.pathname.replace(/^\//, ""));
    }

    return signedS3Url(url);
  } catch {
    return url;
  }
}

export const metadata = pageMetadata({
  title: 'Lizenzen prüfen und Siegelnutzung verwalten',
  description:
    'Lizenzcode prüfen, Lizenzen verwalten und aktuelle Testergebnisse des Deutschen Prüfsiegel Instituts einsehen.',
  path: '/lizenzen',
});

export const dynamic = "force-dynamic";

export default async function LizenzenPage() {
  const locale = normalizeLocale((await cookies()).get("lang")?.value || "de");
  const tr = (de: string, en: string) => (locale === "en" ? en : de);

  const productsRaw = await prisma.product.findMany({
    where: {
      status: { in: ["COMPLETED", "IN_REVIEW", "PAID"] },
      certificate: { isNot: null },
    },
    include: {
      certificate: true,
      license: {
        select: {
          id: true,
          licenseCode: true,
          status: true,
        },
      },
      user: { select: { company: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const products = await Promise.all(
    productsRaw.map(async (product) =>
      product.certificate
        ? {
            ...product,
            certificate: {
              ...product.certificate,
              pdfUrl: await signCertificateAssetUrl(product.certificate.pdfUrl),
              reportUrl: await signCertificateAssetUrl(
                product.certificate.reportUrl,
              ),
              sealUrl: await signCertificateAssetUrl(
                product.certificate.sealUrl,
              ),
            },
          }
        : product,
    ),
  );

  const dateFormatter = new Intl.DateTimeFormat(
    locale === "en" ? "en-US" : "de-DE",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  );
  const recentTestedProducts = products
    .filter(
      (product) =>
        product.certificate?.reportUrl &&
        product.certificate?.pdfUrl &&
        product.certificate?.sealUrl,
    )
    .sort(
      (a, b) =>
        new Date(b.certificate?.createdAt ?? b.createdAt).getTime() -
        new Date(a.certificate?.createdAt ?? a.createdAt).getTime(),
    )
    .slice(0, 3);

  const card =
    "rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_70px_-45px_rgba(43,64,102,0.35)]";
  const steps = [
    {
      icon: Search,
      title: tr("Code eingeben", "Enter code"),
      text: tr(
        "Lizenzcode, Siegelnummer oder Produktname ins Suchfeld eingeben oder den QR-Code auf dem Siegel scannen.",
        "Enter license code, seal number or product name, or scan the QR code on the seal.",
      ),
    },
    {
      icon: BadgeCheck,
      title: tr("Status sehen", "See status"),
      text: tr(
        "Sie sehen sofort, ob das Produkt geprüft wurde und ob die Lizenz aktiv ist.",
        "You instantly see whether the product was tested and the license is active.",
      ),
    },
    {
      icon: FileText,
      title: tr("Bericht öffnen", "Open report"),
      text: tr(
        "Zertifikat und Prüfbericht lassen sich direkt öffnen und nachprüfen.",
        "Open the certificate and test report directly to verify.",
      ),
    },
  ];
  const portalFeatures = [
    tr("Alle Lizenzen und Laufzeiten an einem Ort", "All licenses and terms in one place"),
    tr("Siegelgrafiken und Prüfberichte jederzeit herunterladen", "Download seal graphics and reports any time"),
    tr("Erinnerung 90 Tage vor Ablauf", "Reminder 90 days before expiry"),
    tr("Veröffentlichung des Siegels mit einem Klick melden", "Report seal publication in one click"),
  ];
  const btnPrimary =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1d4ed8] to-[#16294d] px-6 py-3 text-sm font-semibold !text-white shadow-lg shadow-[#1d4ed8]/20 transition hover:-translate-y-0.5";

  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200/70">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-64 w-64 rounded-full bg-[#1d4ed8]/10 blur-3xl" />
          <div className="absolute -right-16 -top-10 h-64 w-64 rounded-full bg-[#2B4066]/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 pb-24 pt-14 text-center sm:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#1d4ed8]/20 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#1d4ed8]">
            <BadgeCheck className="h-4 w-4" />
            {tr("Siegel-Verifizierung", "Seal verification")}
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight text-[#2B4066] sm:text-5xl">
            {tr("Ist dieses Siegel echt?", "Is this seal genuine?")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            {tr(
              "Prüfen Sie Lizenzcode oder Siegelnummer und sehen Sie sofort Status, Prüfbericht und Zertifikat.",
              "Check the license code or seal number and instantly see status, report and certificate.",
            )}
          </p>
        </div>
      </section>

      {/* Suche */}
      <section className="-mt-16 px-6">
        <div className="mx-auto max-w-3xl" data-animate="section">
          <LizenzenClient products={products} />
        </div>
      </section>

      {/* So funktioniert's */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <p className="eyebrow">{tr("So funktioniert's", "How it works")}</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#2B4066] sm:text-3xl">
            {tr("In drei Schritten zur Gewissheit", "Certainty in three steps")}
          </h2>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className={`${card} p-6`} data-animate="card">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1d4ed8]/10 text-[#1d4ed8]">
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-slate-400">{i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#2B4066]">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Lizenzverwaltung */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div
          className="grid items-center gap-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#16294d] to-[#0b1730] p-8 text-white shadow-[0_30px_80px_-40px_rgba(11,23,48,0.8)] sm:p-12 lg:grid-cols-2"
          data-animate="section"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
              {tr("Für Kunden", "For customers")}
            </p>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
              {tr("Lizenzverwaltung im Kundenportal", "License management in the portal")}
            </h2>
            <p className="mt-3 text-slate-300">
              {tr(
                "Sie haben ein Siegel? Hier verwalten Sie Lizenz, Laufzeit und Dokumente selbst.",
                "Already have a seal? Manage license, term and documents yourself.",
              )}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold !text-[#16294d] transition hover:-translate-y-0.5"
              >
                {tr("Zum Kundenportal", "Open portal")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/produkte/produkt-test"
                className="inline-flex items-center justify-center rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold !text-white transition hover:bg-white/10"
              >
                {tr("Noch kein Siegel? Jetzt testen lassen", "No seal yet? Get tested")}
              </Link>
            </div>
          </div>
          <ul className="space-y-3">
            {portalFeatures.map((f) => (
              <li key={f} className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 text-sm text-slate-100 ring-1 ring-white/10">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Zuletzt geprüft */}
      {recentTestedProducts.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">{tr("Live-Übersicht", "Live overview")}</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#2B4066]">
                {tr("Zuletzt geprüfte Produkte", "Recently tested products")}
              </h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {tr("Live aktualisiert", "Updated live")}
            </span>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {recentTestedProducts.map((product) => {
              const createdAt = product.certificate?.createdAt ?? product.createdAt;
              const reportHref = product.certificate?.reportUrl || null;
              const certHref = product.certificate?.pdfUrl ? `/api/certificates/${product.id}/download` : null;
              const sealHref = product.certificate?.sealUrl || null;
              const linkCls =
                "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#2B4066] transition hover:border-[#1d4ed8]/40";
              return (
                <article key={product.id} className={`${card} flex flex-col overflow-hidden`} data-animate="card">
                  <div className="flex items-start gap-4 p-5">
                    <div className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                      {sealHref ? (
                        <img src={sealHref} alt="" className="h-full w-full object-contain p-1.5" />
                      ) : (
                        <BadgeCheck className="h-6 w-6 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          {product.license?.status === "ACTIVE" ? tr("Aktive Lizenz", "Active license") : tr("Geprüft", "Tested")}
                        </span>
                        <span className="text-xs text-slate-500">{dateFormatter.format(new Date(createdAt))}</span>
                      </div>
                      <h3 className="mt-2 text-base font-semibold leading-snug text-[#2B4066]">{product.name}</h3>
                      <p className="mt-0.5 text-sm text-slate-500">{product.brand}</p>
                    </div>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/60 p-4">
                    {reportHref && (
                      <Link href={reportHref} target="_blank" rel="noreferrer" className={linkCls}>
                        {tr("Prüfbericht", "Report")}
                      </Link>
                    )}
                    {certHref && (
                      <Link href={certHref} target="_blank" rel="noreferrer" className={linkCls}>
                        {tr("Zertifikat", "Certificate")}
                      </Link>
                    )}
                    {sealHref && (
                      <Link href={sealHref} target="_blank" rel="noreferrer" className={linkCls}>
                        {tr("Siegel", "Seal")}
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
