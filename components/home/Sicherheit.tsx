"use client";
import Image from 'next/image';
import Link from 'next/link';
import { stagger } from '@/lib/animation';
import { useLocale } from '@/components/LocaleProvider';

export default function Sicherheit() {
  const { locale } = useLocale();
  const copy = locale === 'en'
    ? {
      eyebrow: 'For Safety',
      title: 'Tested Playground Safety',
      body: 'We deliver comprehensive playground inspections per DIN EN 1176/1177—reliable, standards-compliant, and audit-ready. Our process helps operators secure their sites legally and raise operational safety.',
      cta: 'Learn more',
    }
    : {
      eyebrow: 'Für Sicherheit',
      title: 'Zertifizierte Spielplatzsicherheit',
      body: 'Wir liefern vollumfängliche Spielplatzprüfungen nach DIN EN 1176/1177 - zuverlässig, normkonform und auditready. Mit unserem Prüfprozess sichern Betreiber ihre Anlagen rechtssicher ab und erhöhen die Betriebssicherheit.',
      cta: 'Mehr erfahren',
    };

  return (
    <section data-animate="section" className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="order-1 space-y-6" data-animate="card" style={stagger(0)}>
            <span className="text-brand-green text-xs uppercase tracking-widest mb-2 block font-semibold">
              {copy.eyebrow}
            </span>
            <h3 className="text-3xl font-bold text-brand-text">
              {copy.title}
            </h3>
            <p className="text-gray-600 leading-relaxed font-normal">
              {copy.body}
            </p>
            <Link
              href="/produkte/spielplatz-sicherheit"
              className="group inline-flex items-center text-sm font-bold text-brand-green uppercase tracking-wider hover:text-brand-text transition-colors"
            >
              {copy.cta}
              <span className="ml-2 group-hover:translate-x-1 transition-transform">
                &rarr;
              </span>
            </Link>
          </div>
          <div className="order-2 relative aspect-[4/3] overflow-hidden bg-gray-100 shadow-xl rounded-lg" data-animate="card" style={stagger(1)}>
            <Image
              src="/images/expertise_sicherheit.jpeg"
              alt={copy.title}
              fill
              className="object-cover transition-all duration-700"
            />
            <div className="absolute inset-0 border-4 border-white/10"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
