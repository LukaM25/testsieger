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
          <div className="flex flex-wrap gap-4">
            <Link
              href="/produkte/produkt-test"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              Produkt testen lassen
            </Link>
            <Link
              href="/precheck"
              className="inline-flex items-center justify-center rounded-full border border-white/70 px-6 py-3 text-sm font-semibold text-white transition hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              Kostenlosen Pre-Check starten
            </Link>
          </div>
        </div>
        <div className="flex justify-end lg:self-end">
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/30 bg-white/5 p-6 shadow-2xl shadow-slate-900/70 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-200">Zertifiziertes Qualitätssiegel</p>
            <Image
              src="/siegel.png"
              alt="Testsieger Check Siegel"
              width={180}
              height={180}
              className="h-32 w-auto bg-transparent"
            />
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-200 text-center">
              Ausgezeichnet mit dem Testsieger Check Qualitätssiegel
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
