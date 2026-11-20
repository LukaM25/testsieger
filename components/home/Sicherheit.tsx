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
    <section data-animate="section" className="bg-gradient-to-b from-white to-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="order-1 space-y-6" data-animate="card" style={stagger(0)}>
            <span className="eyebrow">
              {copy.eyebrow}
            </span>
            <h3 className="feature-title">
              {copy.title}
            </h3>
            <p className="body-text">
              {copy.body}
            </p>
            <Link
              href="/produkte/spielplatz-sicherheit"
              className="link-more group"
            >
              {copy.cta}
              <span className="ml-2 group-hover:translate-x-1 transition-transform">
                &rarr;
              </span>
            </Link>
          </div>
          <div className="order-2 soft-image" data-animate="card" style={stagger(1)}>
            <Image
              src="/images/expertise_sicherheit.jpeg"
              alt={copy.title}
              fill
              className="object-cover transition-all duration-700"
            />
            
          </div>
        </div>
      </div>
    </section>
  );
}
