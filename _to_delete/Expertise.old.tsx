"use client";
import Image from 'next/image';
import Link from 'next/link';
import { stagger } from '@/lib/animation';
import { useLocale } from '@/components/LocaleProvider';
import MarketplaceLogos from '@/components/MarketplaceLogos';

export default function Expertise() {
  const { locale } = useLocale();
  const copy = locale === 'en'
    ? {
      title: 'Our Expertise',
      block1Title: 'Product tests for companies',
      block1Annotation: 'Amazon, OTTO, Etsy, or other platforms',
      block1Body:
        'We don’t just test – we compare, question, and deliver clear results procurement and product teams can act on. We make transparent what others hide: quality, safety, and everyday usability.',
      more: 'LEARN MORE',
      block2Label: 'For Safety',
      block2Title: 'Occupational Safety',
      block2Body:
        'Safe workplaces start with clear processes. As an occupational safety specialist, we support companies DGUV-compliant in making risks visible and implementing occupational safety in a practical, documented way.',
    }
    : {
      title: 'Unsere Expertise',
      block1Title: 'Einzelprodukttest für Unternehmen',
      block1Annotation: 'Amazon, OTTO, Ebay oder andere Plattformen',
      block1Body:
        'Wir prüfen nicht nur – wir vergleichen, hinterfragen und liefern klare Ergebnisse, auf die Einkauf und Produktteams bauen können. Wir machen transparent, was andere verschweigen: Qualität, Sicherheit und Alltagstauglichkeit.',
      more: 'MEHR ERFAHREN',
      block2Label: 'Für Sicherheit',
      block2Title: 'Arbeitssicherheit',
      block2Body:
        'Sichere Arbeitsplätze beginnen mit klaren Abläufen. Als Fachkraft für Arbeitssicherheit unterstützen wir Unternehmen DGUV-konform dabei, Risiken sichtbar zu machen und Arbeitssicherheit praxisnah und dokumentiert umzusetzen.',
    };
  return (
    <section data-animate="section" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-end justify-between mb-16">
          <h2 className="section-title">{copy.title}</h2>
          <div className="hidden sm:block h-px bg-gradient-to-r from-slate-200 to-transparent w-1/3 mb-2"></div>
        </div>

        {/* Block 1 */}
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="order-1">
            <span className="eyebrow">
              Für Unternehmen
            </span>
            <h3 className="feature-title">
              {copy.block1Title}
            </h3>
            <p className="text-lg font-semibold leading-tight text-brand-text sm:text-xl mb-5">
              {copy.block1Annotation}
            </p>
            <MarketplaceLogos
              className="-mt-2 mb-5"
              label={locale === 'en' ? 'Supported sales channels' : 'Unterstützte Verkaufskanäle'}
            />
            <p className="body-text mb-8">
              {copy.block1Body}
            </p>
            <Link
              href="/produkte/produkt-test"
              className="link-more group"
            >
              {copy.more}
              <span className="ml-2 group-hover:translate-x-1 transition-transform">
                &rarr;
              </span>
            </Link>
          </div>
          <div className="order-2 soft-image !aspect-square">
            <Image
              src="/images/expertise_produkttest_v2.jpg"
              alt={copy.block1Title}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="scale-[1.25] object-cover"
            />
            
          </div>
        </div>

        {/* Block 2: Arbeitssicherheit */}
        <div className="grid items-center gap-12 md:grid-cols-2 mt-24">
          <div className="order-2 md:order-1 soft-image !aspect-square">
            <Image
              src="/images/expertise_arbeitssicherheit_v3.jpg"
              alt={copy.block2Title}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="scale-[1.25] object-cover"
            />
          </div>
          <div className="order-1 md:order-2">
            <span className="eyebrow">{copy.block2Label}</span>
            <h3 className="feature-title">{copy.block2Title}</h3>
            <p className="body-text mb-8">{copy.block2Body}</p>
            <Link href="/kontakt" className="link-more group">
              {copy.more}
              <span className="ml-2 group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
