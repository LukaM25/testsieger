'use client';
import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0">
        <Image
          src="/images/hero.jpg"
          alt="Vertrauensvoller Handschlag"
          fill
          priority
          className="object-cover brightness-75"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/60 to-transparent" />
      </div>
      <div className="relative mx-auto grid max-w-6xl gap-8 px-6 py-16 sm:gap-10 sm:py-20 lg:grid-cols-[1.1fr,0.9fr] lg:items-end lg:py-24">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-300">Testsieger Check</p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Vertrauen durch <span className="text-sky-300">Prüfung</span>
            </h1>
          </div>
          <p className="text-base sm:text-lg text-slate-200 max-w-3xl">
            Objektive Bewertungen, transparente Verfahren und messbare Qualität – mit einem Siegel, das Orientierung schafft.
          </p>
          <p className="text-base font-semibold text-slate-200">
            Ein Qualitätssiegel, das zeigt, ob Ihr Produkt die Lizenzkriterien erfüllt – transparent, objektiv und nachvollziehbar.
          </p>
          {/* Buttons removed as requested */}
        </div>
  {/* Certificate badge removed as requested */}
      </div>
    </section>
  );
}
