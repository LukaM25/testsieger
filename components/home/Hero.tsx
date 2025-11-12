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
      <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-6 py-16 sm:gap-8 sm:py-20 lg:py-24">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-300">Testsieger Check</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Vertrauen durch <span className="text-sky-300">Prüfung</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-200">
            Objektive Bewertungen, transparente Verfahren und messbare Qualität – mit einem Siegel, das Orientierung
            schafft.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
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

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-white/30 bg-white/5 p-6 shadow-2xl shadow-slate-900/70">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
                <Image src="/hero-badge.svg" alt="Offizielles Testsieger Qualitätssiegel" width={64} height={64} className="h-12 w-12" />
              </div>
              <p className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Zertifiziertes Qualitätssiegel</p>
            </div>
            <p className="text-sm text-slate-200 max-w-xl">
              Ausgezeichnete Produkte stehen für geprüfte Seriosität und Transparenz – gestützt durch unabhängige Testergebnisse.
            </p>
          </div>
          <div className="flex justify-end">
            <div className="flex items-center gap-4 rounded-3xl border border-white/30 bg-white/10 px-6 py-5 shadow-xl shadow-slate-900/60 backdrop-blur">
              <Image
                src="/siegel.png"
                alt="Siegel des Testsiegers"
                width={128}
                height={128}
                className="h-24 w-auto"
              />
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                Ausgezeichnet mit dem Testsieger Check Qualitätssiegel
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
