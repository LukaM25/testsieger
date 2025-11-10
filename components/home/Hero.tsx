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
      <div className="absolute inset-0 flex items-center">
        <div className="mx-auto w-full max-w-6xl px-6">
          <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Vertrauen durch<br />Prüfung
          </h1>
          <p className="mt-4 max-w-lg text-base sm:text-lg text-gray-700">
            Objektive Bewertungen, transparente Verfahren, messbare Qualität.
          </p>
        </div>
      </div>
    </section>
  );
}
