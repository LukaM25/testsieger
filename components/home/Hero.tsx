"use client";
import Image from 'next/image';

export default function Hero() {
  return (
<section className="relative overflow-hidden bg-slate-950 text-white min-h-[80vh] lg:min-h-[70vh] xl:min-h-[70vh]">
      {/* hero image container is absolute so we set section min-height to reveal more of the photo on large screens */}
      <div data-animate="hero-image" className="absolute inset-0">
        <Image
          src="/images/hero.jpg"
          alt="Vertrauensvoller Handschlag"
          fill
          priority
          className="object-cover object-center brightness-75"
          style={{ objectPosition: "50% 25%" }}
          sizes="120vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/60 to-transparent" />
      </div>

  <div className="relative mx-auto grid max-w-6xl gap-8 px-6 py-16 sm:gap-10 sm:py-20 lg:grid-cols-[1.1fr,0.9fr] lg:items-end lg:py-24">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 data-animate="hero-title" className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Vertrauen durch <span className="text-sky-300">Prüfung</span>
            </h1>
          </div>
          <div data-animate="hero-text" className="space-y-4 text-base sm:text-lg text-slate-200 max-w-3xl">
            <p>
              Objektive Bewertungen, transparente Verfahren und messbare Qualität – mit einem Siegel, das Orientierung schafft.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <span aria-hidden className="w-full sm:w-auto h-10 sm:h-auto" />
            <span aria-hidden className="w-full sm:w-auto h-10 sm:h-auto" />
          </div>
        </div>

        <div className="hidden lg:flex items-end justify-end">
          <div className="mr-6 mb-6 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white/90 shadow-lg transform transition motion-safe:animate-float">
            Zertifikat &nbsp;•&nbsp; QR‑Verifikation
          </div>
        </div>
      </div>
    </section>
  );
}
