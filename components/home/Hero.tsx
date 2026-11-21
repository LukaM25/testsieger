"use client";

import Link from 'next/link';
import { useLocale } from '@/components/LocaleProvider';

export default function Hero() {
  const { locale } = useLocale();
  const copy = locale === 'en'
    ? {
      title: <>Show that your product holds up in <span className="text-brand-green">everyday use</span></>,
      body: 'We test your product under real conditions, not in a lab. You get a report and a seal that convinces buyers on Amazon, Otto, Kaufland and in your own shop.',
      ctaPrimary: 'Have product tested from 179 EUR net',
      ctaSecondary: 'Free Pre-Check',
      chips: ['Tested in everyday use', 'Report with QR code', 'Seal from grade 3.0', 'Resubmit free of charge'],
      example: 'Example result',
      grade: 'Overall grade',
      awarded: 'Seal awarded',
      crit: ['Protection and packaging', 'Workmanship', 'Everyday test', 'Value for money'],
    }
    : {
      title: <>Zeigen Sie, dass Ihr Produkt im <span className="text-brand-green">Alltag</span> besteht</>,
      body: 'Wir testen Ihr Produkt unter echten Bedingungen, nicht im Labor. Sie erhalten einen Prüfbericht und ein Siegel, das Käufer auf Amazon, Otto, Kaufland und in Ihrem eigenen Shop überzeugt.',
      ctaPrimary: 'Produkt testen lassen ab 179 € netto',
      ctaSecondary: 'Kostenloser Pre-Check',
      chips: ['Im Alltag getestet', 'Prüfbericht mit QR-Code', 'Siegel ab Note 3,0', 'Erneut prüfen kostenlos'],
      example: 'Beispiel-Ergebnis',
      grade: 'Gesamtnote',
      awarded: 'Siegel erteilt',
      crit: ['Produktschutz und Verpackung', 'Verarbeitung', 'Praxistest im Alltag', 'Preis-Leistung'],
    };

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white min-h-[70vh] lg:min-h-[72vh] xl:min-h-[72vh]">
      {/* hero image container is absolute so we set section min-height to reveal more of the photo on large screens */}
      <div data-animate="hero-image" className="absolute inset-0 isolate">
        <video
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover brightness-[0.85]"
        >
          <source src="/videos/handshakevideo.mp4" type="video/mp4" />
        </video>
      </div>
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-950/80 to-slate-900/60 pointer-events-none"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 sm:py-24 lg:py-28 animate-fade-in-up">
      <style>{`@keyframes hBar{from{width:0}}@keyframes hRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@keyframes hFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}@media (prefers-reduced-motion:reduce){.h-a{animation:none!important}}`}</style>
      <div aria-hidden="true" className="h-a absolute right-6 top-1/2 hidden w-[330px] -translate-y-1/2 lg:block xl:right-10" style={{ animation: 'hRise .9s ease .3s both' }}>
        <div className="h-a rounded-3xl border border-white/15 bg-white/10 p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur-md" style={{ animation: 'hFloat 7s ease-in-out 1.2s infinite' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">{copy.example}</p>
          <div className="mt-4 space-y-3.5">
            {copy.crit.map((c, i) => (
              <div key={c}>
                <div className="flex justify-between text-xs text-white/80"><span>{c}</span></div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15">
                  <div className="h-a h-full rounded-full bg-gradient-to-r from-sky-300 to-emerald-400" style={{ width: [86, 78, 90, 72][i] + '%', animation: 'hBar 1.4s ease ' + (0.6 + i * 0.2) + 's both' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
            <div>
              <p className="text-xs text-white/65">{copy.grade}</p>
              <p className="text-2xl font-semibold text-white">1,8</p>
            </div>
            <span className="rounded-full bg-emerald-400 px-3.5 py-1.5 text-xs font-semibold text-emerald-950">{copy.awarded}</span>
          </div>
        </div>
      </div>

        <div className="max-w-3xl space-y-8 lg:max-w-[600px] lg:space-y-10 xl:max-w-2xl">
          <div className="space-y-5">
            <div className="inline-block border-b border-brand-green pb-1.5 mb-3">
              <span className="text-brand-green text-xs uppercase tracking-[0.2em] font-semibold">
              </span>
            </div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl drop-shadow-[0_10px_35px_rgba(0,0,0,0.55)]">
              {copy.title}
            </h1>
        </div>
        <div className="max-w-2xl">
          <div className="inline-block space-y-4 px-4 py-3 sm:px-5 sm:py-4 text-base sm:text-lg md:text-xl text-gray-100 font-normal leading-relaxed">
            <p>{copy.body}</p>
          </div>
        </div>
        <div data-animate="hero-cta" className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/produkte/produkt-test"
            className="inline-flex items-center justify-center rounded-lg bg-brand-green px-7 py-3.5 text-base font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-primary hover:text-white"
          >
            {copy.ctaPrimary}
          </Link>
          <Link
            href="/produkte/produkt-test?precheck=open#precheck"
            className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/10 px-7 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20 hover:text-white"
          >
            {copy.ctaSecondary}
          </Link>
        </div>
        <ul className="flex flex-wrap gap-2.5">
          {copy.chips.map((c) => (
            <li key={c} className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur">{c}</li>
          ))}
        </ul>
      </div>
    </div>
    </section>
  );
}
