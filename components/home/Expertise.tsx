"use client";
import Image from 'next/image';
import Link from 'next/link';
import { stagger } from '@/lib/animation';
import { useLocale } from '@/components/LocaleProvider';

export default function Expertise() {
  const { locale } = useLocale();
  const copy = locale === 'en'
    ? {
      title: 'Our Expertise',
      block1Title: 'Product tests for companies',
      block1Body:
        'We don’t just test – we compare, question, and deliver clear results procurement and product teams can act on. We make transparent what others hide: quality, safety, and everyday usability.',
      more: 'LEARN MORE',
      block2Title: 'Company assessments for training',
      block2Body:
        'We evaluate training positions transparently and systematically. With our seal, companies belong to the best training places – for smart decisions by trainees.',
    }
    : {
      title: 'Unsere Expertise',
      block1Title: 'Produkt Tests für Unternehmen',
      block1Body:
        'Wir prüfen nicht nur – wir vergleichen, hinterfragen und liefern klare Ergebnisse, auf die Einkauf und Produktteams bauen können. Wir machen transparent, was andere verschweigen: Qualität, Sicherheit und Alltagstauglichkeit.',
      more: 'MEHR ERFAHREN',
      block2Title: 'Betriebsbewertung für Ausbildung',
      block2Body:
        'Wir bewerten Ausbildungsplätze transparent und strukturiert. Mit unserem Siegel zählen Betriebe zu den besten Ausbildungsstellen – für kluge Entscheidungen von Azubis.',
    };
  return (
    <section data-animate="section" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-end justify-between mb-16">
          <h2 className="text-4xl font-bold text-brand-text">{copy.title}</h2>
          <div className="hidden sm:block h-px bg-gray-200 w-1/3 mb-2"></div>
        </div>

        {/* Block 1 */}
        <div className="grid items-center gap-12 md:grid-cols-2 mb-24">
          <div className="order-1">
            <span className="text-brand-green text-xs uppercase tracking-widest mb-2 block font-semibold">
              Für Unternehmen
            </span>
            <h3 className="text-3xl font-bold text-brand-text mb-6">
              {copy.block1Title}
            </h3>
            <p className="text-gray-600 leading-relaxed font-normal mb-8">
              {copy.block1Body}
            </p>
            <Link
              href="/produkte/produkt-test"
              className="group inline-flex items-center text-sm font-bold text-brand-green uppercase tracking-wider hover:text-brand-text transition-colors"
            >
              {copy.more}
              <span className="ml-2 group-hover:translate-x-1 transition-transform">
                &rarr;
              </span>
            </Link>
          </div>
          <div className="order-2 relative aspect-[4/3] overflow-hidden bg-gray-100 shadow-xl rounded-lg">
            <Image
              src="/images/expertise_produkt.jpeg"
              alt={copy.block1Title}
              fill
              className="object-cover transition-all duration-700"
            />
            <div className="absolute inset-0 border-4 border-white/10"></div>
          </div>
        </div>

        {/* Block 2 (Reversed) */}
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="order-2 md:order-1 relative aspect-[4/3] overflow-hidden bg-gray-100 shadow-xl rounded-lg">
            <Image
              src="/images/expertise_training.jpeg"
              alt={copy.block2Title}
              fill
              className="object-cover transition-all duration-700"
            />
            <div className="absolute inset-0 border-4 border-white/10"></div>
          </div>
          <div className="order-1 md:order-2">
            <span className="text-brand-green text-xs uppercase tracking-widest mb-2 block font-semibold">
              Für Ausbildung
            </span>
            <h3 className="text-3xl font-bold text-brand-text mb-6">
              {copy.block2Title}
            </h3>
            <p className="text-gray-600 leading-relaxed font-normal mb-8">
              {copy.block2Body}
            </p>
            <Link
              href="/produkte/ausbildung-check"
              className="group inline-flex items-center text-sm font-bold text-brand-green uppercase tracking-wider hover:text-brand-text transition-colors"
            >
              {copy.more}
              <span className="ml-2 group-hover:translate-x-1 transition-transform">
                &rarr;
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
