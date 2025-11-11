'use client';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Replace /images/hero.jpg with your own handshake photo */}
      <Image
        src="/images/hero.jpg"
        alt="Vertrauensvoller Handschlag"
        width={2400}
        height={1200}
        priority
        className="h-[58vh] w-full object-cover sm:h-[68vh] lg:h-[76vh]"
      />
      {/* gradient overlay to match tone */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/40 to-transparent" />
      <div className="absolute inset-0 flex items-end">
        <div className="mx-auto w-full max-w-6xl px-6 pb-12 sm:pb-16">
          <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Vertrauen durch<br />Prüfung
          </h1>
          <p className="mt-4 max-w-lg text-base sm:text-lg text-gray-700">
            Objektive Bewertungen, transparente Verfahren, messbare Qualität.
          </p>
          <div className="mt-8 inline-flex items-center gap-4 rounded-full bg-white/80 px-5 py-3 shadow-lg backdrop-blur sm:gap-6">
            <Image
              src="/hero-badge.svg"
              alt="Offizielles Testsieger Qualitätssiegel"
              width={72}
              height={72}
              className="h-16 w-16"
            />
            <div className="text-left">
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-900">
                Zertifiziertes Qualitätssiegel
              </p>
              <p className="text-xs text-gray-600">
                Ihre Prozesse sind durch Testsieger.de unabhängig geprüft.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div
        className="absolute bottom-6 right-5 hidden md:flex transform"
        style={{ transform: 'translate(calc(-15% - 200px), calc(-15% - 150px)) scale(1.5)' }}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <Image
            src="/siegel.png"
            alt="Siegel des Testsiegers"
            width={260}
            height={260}
            className="h-48 w-auto object-contain drop-shadow-[0_12px_24px_rgba(15,23,42,0.35)]"
          />
          <div className="max-w-[220px] rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-xs leading-tight text-slate-600 shadow-sm backdrop-blur">
            Ausgezeichnet mit dem Testsieger.de Qualitätssiegel – geprüfte Seriosität und Transparenz für unsere Partner.
          </div>
        </div>
      </div>
    </section>
  );
}
