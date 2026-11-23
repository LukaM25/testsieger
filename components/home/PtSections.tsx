"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  Euro,
  PackageCheck,
  QrCode,
  Repeat,
  Send,
  ShieldCheck,
  Wrench,
  FileCheck2,
} from "lucide-react";
import { stagger } from "@/lib/animation";
import { useLocale } from "@/components/LocaleProvider";

const CARD =
  "rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_60px_-45px_rgba(43,64,102,0.35)]";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">{children}</span>;
}

const ANIM = `
@keyframes ptRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes ptBar{from{width:0}}
@keyframes ptPulse{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.35)}50%{box-shadow:0 0 0 10px rgba(16,185,129,0)}}
@keyframes ptDash{to{stroke-dashoffset:-24}}
@keyframes ptFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes ptShine{0%{background-position:130% 0}60%,100%{background-position:-130% 0}}
@keyframes ptGlow{0%,100%{opacity:.35;transform:scale(1)}50%{opacity:.6;transform:scale(1.08)}}
@media (prefers-reduced-motion:reduce){.pt-a{animation:none!important}}
`;

/* Schwebendes DPI-Siegel mit wiederkehrendem Glanz */
function PtSeal({ label }: { label: string }) {
  return (
    <div className="relative mx-auto hidden w-44 shrink-0 md:block lg:w-52">
      <span aria-hidden="true" className="pt-a absolute inset-4 rounded-full bg-sky-300/40 blur-2xl" style={{ animation: "ptGlow 5s ease-in-out infinite" }} />
      <div className="pt-a relative" style={{ animation: "ptFloat 6s ease-in-out infinite" }}>
        <Image src="/siegel19.png" alt={label} width={420} height={480} className="relative h-auto w-full drop-shadow-[0_24px_30px_rgba(11,23,48,0.35)]" />
        <span
          aria-hidden="true"
          className="pt-a pointer-events-none absolute inset-0"
          style={{
            WebkitMaskImage: "url(/siegel19.png)",
            maskImage: "url(/siegel19.png)",
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
            backgroundImage: "linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.85) 50%, transparent 62%)",
            backgroundSize: "250% 100%",
            animation: "ptShine 4.5s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

/* 1. Alltagstest */
export function PtAlltag() {
  const { locale } = useLocale();
  const en = locale === "en";
  const items = en
    ? [
        { Icon: PackageCheck, t: "Protection and packaging", b: "Does it arrive intact? We check how the product survives shipping and how it looks when unboxed.", w: "" },
        { Icon: Wrench, t: "Workmanship and appearance", b: "We look at materials, finish and details the way your customers do, up close.", w: "counts double" },
        { Icon: Repeat, t: "Practical everyday test", b: "We use the product as intended, again and again, and note what works and what annoys.", w: "counts double" },
        { Icon: Euro, t: "Value and user feedback", b: "Is the price fair for what you get? We include what real users say.", w: "" },
      ]
    : [
        { Icon: PackageCheck, t: "Produktschutz und Verpackung", b: "Kommt es heil an? Wir prüfen, wie das Produkt den Versand übersteht und wie es beim Auspacken wirkt.", w: "" },
        { Icon: Wrench, t: "Verarbeitung und Erscheinungsbild", b: "Material, Verarbeitung und Details, so genau angesehen, wie es Ihre Kunden tun.", w: "zählt doppelt" },
        { Icon: Repeat, t: "Praxistest im Alltag", b: "Wir nutzen das Produkt wie vorgesehen, immer wieder, und halten fest, was überzeugt und was nervt.", w: "zählt doppelt" },
        { Icon: Euro, t: "Preis-Leistung und Nutzerstimmen", b: "Passt der Preis zur Leistung? Dazu gehört, was echte Nutzer berichten.", w: "" },
      ];
  return (
    <section data-animate="section" className="bg-white px-6 py-20 sm:py-24">
      <style>{ANIM}</style>
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-10">
        <div className="max-w-3xl">
          <Eyebrow>{en ? "Tested in everyday use" : "Im Alltag getestet"}</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#2B4066] sm:text-4xl">
            {en ? "Tested the way your customers use it" : "Getestet, wie Ihre Kunden es nutzen"}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            {en
              ? "No lab number that means nothing at home. We unpack, set up, use and judge your product under real conditions, so the result shows what buyers will experience."
              : "Kein Laborwert, der zu Hause nichts bedeutet. Wir packen aus, bauen auf, nutzen und beurteilen Ihr Produkt unter echten Bedingungen. So zeigt das Ergebnis, was Käufer später erleben."}
          </p>
        </div>
        <PtSeal label={en ? "Everyday tested" : "Im Alltag getestet"} />
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ Icon, t, b, w }, i) => (
            <article
              key={t}
              data-animate="card"
              style={stagger(i)}
              className={`${CARD} group relative flex flex-col p-6 transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_70px_-40px_rgba(43,64,102,0.5)]`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 text-sky-700 ring-1 ring-sky-100 transition duration-500 group-hover:scale-110 group-hover:rotate-3">
                <Icon className="h-6 w-6" strokeWidth={1.6} aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-[#2B4066]">{t}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{b}</p>
              {w && (
                <span className="mt-4 inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  {w}
                </span>
              )}
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-[#16294d] to-[#0b1730] p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <p className="max-w-2xl text-base leading-relaxed text-white/90">
            {en
              ? "The four areas result in a weighted school grade. The seal is awarded from grade 3.0. If a product falls short, you get clear feedback and can resubmit it free of charge."
              : "Aus den vier Bereichen entsteht eine gewichtete Schulnote. Das Siegel gibt es ab Note 3,0. Besteht ein Produkt nicht, erhalten Sie klare Rückmeldung und reichen es kostenlos erneut ein."}
          </p>
          <Link
            href="/produkte/produkt-test#unser-pruefverfahren"
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold !text-sky-200 hover:!text-white"
          >
            {en ? "See our testing method" : "Prüfverfahren ansehen"}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* 2. Nutzen */
export function PtNutzen() {
  const { locale } = useLocale();
  const en = locale === "en";
  const items = en
    ? [
        { Icon: ShieldCheck, t: "Independent proof", b: "A private testing body assesses your product by fixed, documented criteria. That counts more than your own claims." },
        { Icon: QrCode, t: "Report with QR code", b: "Buyers scan the code and see the result for themselves. Nothing to take on trust." },
        { Icon: BadgeCheck, t: "Seal for every sales channel", b: "You receive the seal as an image file and use it on Amazon, Otto, Kaufland, in your own shop and in advertising, wherever the buying decision is made." },
      ]
    : [
        { Icon: ShieldCheck, t: "Unabhängiger Beleg", b: "Eine private Prüfstelle bewertet Ihr Produkt nach festen, dokumentierten Kriterien. Das zählt mehr als jede eigene Behauptung." },
        { Icon: QrCode, t: "Prüfbericht mit QR-Code", b: "Käufer scannen den Code und sehen das Ergebnis selbst. Nichts muss geglaubt werden, alles ist nachvollziehbar." },
        { Icon: BadgeCheck, t: "Siegel für jeden Verkaufskanal", b: "Sie erhalten das Siegel als Bilddatei und nutzen es auf Amazon, Otto, Kaufland, im eigenen Shop und in der Werbung, überall dort, wo die Kaufentscheidung fällt." },
      ];
  return (
    <section data-animate="section" className="bg-gradient-to-b from-slate-50 to-white px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>{en ? "Why it pays off" : "Das bringt es Ihnen"}</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#2B4066] sm:text-4xl">
            {en ? "Give buyers a reason to choose you" : "Geben Sie Käufern den Grund, sich für Sie zu entscheiden"}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            {en
              ? "On a marketplace, many products look alike. A visible, verifiable test result sets yours apart."
              : "Auf dem Marktplatz sehen viele Produkte gleich aus. Ein sichtbares, prüfbares Testergebnis hebt Ihres ab."}
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map(({ Icon, t, b }, i) => (
            <article key={t} data-animate="card" style={stagger(i)} className={`${CARD} relative overflow-hidden p-7 transition duration-500 hover:-translate-y-1.5`}>
              <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-100 to-transparent opacity-70 blur-xl" />
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                <Icon className="h-7 w-7" strokeWidth={1.6} aria-hidden="true" />
              </span>
              <h3 className="relative mt-6 text-xl font-semibold text-[#2B4066]">{t}</h3>
              <p className="relative mt-2 text-[15px] leading-relaxed text-slate-600">{b}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 3. Ablauf */
export function PtAblauf() {
  const { locale } = useLocale();
  const en = locale === "en";
  const steps = en
    ? [
        { Icon: ClipboardCheck, t: "Free pre-check", b: "You describe your product. We tell you if and how we can test it." },
        { Icon: Send, t: "Send in your product", b: "Order online and send the product to us by post." },
        { Icon: FileCheck2, t: "Everyday test and report", b: "We test under real conditions and write a detailed report." },
        { Icon: BadgeCheck, t: "Use your seal", b: "If you pass, you choose a licence plan and use the seal right away." },
      ]
    : [
        { Icon: ClipboardCheck, t: "Kostenloser Pre-Check", b: "Sie beschreiben Ihr Produkt. Wir sagen Ihnen, ob und wie wir es testen." },
        { Icon: Send, t: "Produkt einsenden", b: "Online beauftragen und das Produkt per Post an uns schicken." },
        { Icon: FileCheck2, t: "Alltagstest und Prüfbericht", b: "Wir testen unter echten Bedingungen und schreiben einen ausführlichen Bericht." },
        { Icon: BadgeCheck, t: "Siegel nutzen", b: "Bestanden? Dann wählen Sie den Lizenzplan und nutzen das Siegel sofort." },
      ];
  return (
    <section data-animate="section" className="bg-white px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <Eyebrow>{en ? "How it works" : "So läuft es ab"}</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#2B4066] sm:text-4xl">
            {en ? "From pre-check to seal in four steps" : "In vier Schritten vom Pre-Check zum Siegel"}
          </h2>
        </div>
        <div className="relative mt-14">
          <svg aria-hidden="true" className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-7 hidden h-1 w-[75%] lg:block" preserveAspectRatio="none" viewBox="0 0 100 1">
            <line x1="0" y1="0.5" x2="100" y2="0.5" stroke="#38bdf8" strokeWidth="0.6" strokeDasharray="2 2" className="pt-a" style={{ animation: "ptDash 2s linear infinite" }} vectorEffect="non-scaling-stroke" />
          </svg>
          <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ Icon, t, b }, i) => (
              <li key={t} data-animate="card" style={stagger(i)} className="relative flex flex-col items-start lg:items-center lg:text-center">
                <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1d4ed8] to-[#16294d] text-white shadow-lg shadow-blue-900/25 ring-4 ring-white">
                  <Icon className="h-6 w-6" strokeWidth={1.7} aria-hidden="true" />
                </span>
                <span className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">{en ? "Step" : "Schritt"} {i + 1}</span>
                <h3 className="mt-1 text-lg font-semibold text-[#2B4066]">{t}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-600">{b}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* 4. Partner Sportstech */
const SPORTSTECH_IMAGES: { src: string; w: number; h: number; href?: string; de: { alt: string; cap: string }; en: { alt: string; cap: string } }[] = [
  {
    href: "https://www.amazon.de/dp/B0FC2KW72F",
    src: "/images/partner/sportstech-laufband.jpg", w: 1455, h: 1500,
    de: { alt: "Sportstech Laufband mit DPI-Siegel im Amazon-Listing", cap: "Laufband, Note 1,4 (Sehr gut)" },
    en: { alt: "Sportstech treadmill with the DPI seal in the Amazon listing", cap: "Treadmill, grade 1.4 (very good)" },
  },
  {
    href: "https://www.amazon.de/dp/B0DRPGVJNQ",
    src: "/images/partner/sportstech-rudergeraet.jpg", w: 1484, h: 1461,
    de: { alt: "Sportstech Rudergerät mit DPI-Siegel im Amazon-Listing", cap: "Rudergerät, Note 1,2 (Sehr gut)" },
    en: { alt: "Sportstech rowing machine with the DPI seal in the Amazon listing", cap: "Rowing machine, grade 1.2 (very good)" },
  },
];

export function PtPartner() {
  const { locale } = useLocale();
  const en = locale === "en";
  const stats = en
    ? [["5", "products tested"], ["Official", "partner"], ["1.2 / 1.4", "best grades so far"]]
    : [["5", "Produkte getestet"], ["Offizieller", "Partner"], ["1,2 / 1,4", "Noten im Listing"]];
  return (
    <section data-animate="section" className="bg-gradient-to-b from-slate-50 to-white px-6 pt-20 sm:pt-24">
      <div className="mx-auto max-w-6xl">
        <div className={`${CARD} relative grid overflow-hidden lg:grid-cols-[0.95fr_1.05fr]`}>
          <div className="p-8 sm:p-10 lg:p-12">
            <Eyebrow>{en ? "Trusted partner" : "Vertrauenspartner"}</Eyebrow>
            <Image src="/images/logos/sportstech.png" alt="Sportstech" width={260} height={90} className="mt-4 h-auto w-44 object-contain" />
            <h2 className="mt-6 text-2xl font-semibold tracking-tight text-[#2B4066] sm:text-3xl">
              {en ? "Official partner of Sportstech" : "Offizieller Partner von Sportstech"}
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-600">
              {en
                ? "We work with Sportstech in a cooperation. Five of their products have already gone through our everyday test. The seal is part of the product image on Amazon, and the QR code opens the full test report."
                : "Mit Sportstech verbindet uns eine Kooperation. Fünf Produkte des Herstellers haben unseren Alltagstest bereits durchlaufen. Das Siegel ist Teil des Produktbilds auf Amazon, und der QR-Code öffnet den vollständigen Prüfbericht."}
            </p>
            <dl className="mt-7 grid grid-cols-3 gap-3">
              {stats.map(([n, l]) => (
                <div key={l} className="rounded-2xl bg-slate-50 px-3 py-3 text-center ring-1 ring-slate-200/70">
                  <dt className="text-lg font-semibold text-[#2B4066] sm:text-xl">{n}</dt>
                  <dd className="mt-0.5 text-[11px] leading-tight text-slate-500">{l}</dd>
                </div>
              ))}
            </dl>
            <Link href="/produkte/produkt-test" className="group mt-8 inline-flex items-center gap-2 rounded-full bg-[#2B4066] px-6 py-3 text-sm font-semibold !text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#1e3050]">
              {en ? "Have your product tested" : "Auch Ihr Produkt testen lassen"}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
          <div className="relative flex items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50 p-6 sm:p-8">
            <span aria-hidden="true" className="pt-a absolute h-56 w-56 rounded-full bg-sky-200/50 blur-3xl" style={{ animation: "ptGlow 6s ease-in-out infinite" }} />
            <div className="relative grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
              {SPORTSTECH_IMAGES.map((im, i) => {
                const t = en ? im.en : im.de;
                return (
                  <figure key={im.src} className={i === 1 ? "sm:mt-8" : ""}>
                    <Image
                      src={im.src}
                      alt={t.alt}
                      width={im.w}
                      height={im.h}
                      sizes="(min-width:1024px) 280px, (min-width:640px) 40vw, 90vw"
                      className="pt-a h-auto w-full rounded-2xl shadow-[0_30px_60px_-30px_rgba(11,23,48,0.6)]"
                      style={{ animation: `ptFloat ${6 + i}s ease-in-out ${i * 0.8}s infinite` }}
                    />
                    <figcaption className="mt-3 text-center text-xs text-slate-500">{t.cap}</figcaption>
                    {im.href && (
                      <a href={im.href} target="_blank" rel="noopener noreferrer nofollow" className="mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1d4ed8] hover:underline">
                        {en ? "View Amazon listing" : "Zum Amazon-Listing"}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </figure>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 5. Abschluss-CTA */
export function PtCta() {
  const { locale } = useLocale();
  const en = locale === "en";
  const points = en
    ? ["Test fee 179 EUR net per product", "20 % off from 2 products, 30 % from 3", "Licence plan only after you pass", "Failed? Resubmit free of charge"]
    : ["Testgebühr 179 € netto pro Produkt", "20 % Rabatt ab 2 Produkten, 30 % ab 3", "Lizenzplan erst nach bestandener Prüfung", "Nicht bestanden? Kostenlos erneut einreichen"];
  return (
    <section data-animate="section" className="bg-white px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#16294d] to-[#0b1730] p-8 text-white shadow-[0_40px_90px_-45px_rgba(11,23,48,0.9)] sm:p-12">
          <span aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
          <span aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {en ? "Show that your product holds up in everyday use" : "Zeigen Sie, dass Ihr Produkt im Alltag besteht"}
              </h2>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/80">
                {en
                  ? "Start with the free pre-check. No obligation, no cost, and you know within a short time how we would test your product."
                  : "Starten Sie mit dem kostenlosen Pre-Check. Unverbindlich, ohne Kosten, und Sie wissen schnell, wie wir Ihr Produkt testen würden."}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/produkte/produkt-test?precheck=open#precheck"
                  className="pt-a group inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-7 py-4 text-base font-semibold !text-emerald-950 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-300"
                  style={{ animation: "ptPulse 2.8s ease-in-out infinite" }}
                >
                  {en ? "Start free pre-check" : "Kostenlosen Pre-Check starten"}
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <Link
                  href="/precheck"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-7 py-4 text-base font-semibold !text-white backdrop-blur transition hover:bg-white/20"
                >
                  {en ? "Have product tested" : "Produkt testen lassen"}
                </Link>
              </div>
            </div>
            <ul className="space-y-3">
              {points.map((p) => (
                <li key={p} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/95 ring-1 ring-white/10">
                  <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
