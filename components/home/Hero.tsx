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
    }
    : {
      title: <>Zeigen Sie, dass Ihr Produkt im <span className="text-brand-green">Alltag</span> besteht</>,
      body: 'Wir testen Ihr Produkt unter echten Bedingungen, nicht im Labor. Sie erhalten einen Prüfbericht und ein Siegel, das Käufer auf Amazon, Otto, Kaufland und in Ihrem eigenen Shop überzeugt.',
      ctaPrimary: 'Produkt testen lassen ab 179 € netto',
      ctaSecondary: 'Kostenloser Pre-Check',
      chips: ['Im Alltag getestet', 'Prüfbericht mit QR-Code', 'Siegel ab Note 3,0', 'Erneut prüfen kostenlos'],
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
        <div className="max-w-3xl space-y-8 lg:space-y-10">
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
