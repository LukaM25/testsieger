"use client";

import { useLocale } from '@/components/LocaleProvider';

export default function Hero() {
  const { locale } = useLocale();
  const copy = locale === 'en'
    ? {
      title: <>Trust through <span className="text-brand-green">testing</span></>,
      body: 'Objective assessments, transparent methods and measurable quality – with a seal that provides guidance.',
      ctaPrimary: 'Have product tested',
      ctaSecondary: 'Free Pre-Check',
    }
    : {
      title: <>Vertrauen durch <span className="text-brand-green">Prüfung</span></>,
      body: 'Objektive Bewertungen, transparente Verfahren und messbare Qualität  mit einem Siegel, das Orientierung schafft.',
      ctaPrimary: 'Produkt testen lassen',
      ctaSecondary: 'Kostenloser Pre-Check',
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
        <div className="max-w-3xl space-y-10 lg:space-y-12">
          <div className="space-y-5">
            <div className="inline-block border-b border-brand-green pb-1.5 mb-3">
              <span className="text-brand-green text-xs uppercase tracking-[0.2em] font-semibold">
              </span>
            </div>
            <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl drop-shadow-[0_10px_35px_rgba(0,0,0,0.55)]">
              {copy.title}
            </h1>
        </div>
        <div className="max-w-2xl">
          <div className="inline-block space-y-4 px-4 py-3 sm:px-5 sm:py-4 text-base sm:text-lg md:text-xl text-gray-100 font-normal leading-relaxed">
            <p>{copy.body}</p>
          </div>
        </div>
      </div>
    </div>
    </section>
  );
}
