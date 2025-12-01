"use client";
import Link from 'next/link';
import { stagger } from '@/lib/animation';
import { useLocale } from '@/components/LocaleProvider';

export default function Verfahren() {
  const { locale } = useLocale();
  const copy = locale === 'en'
    ? {
      title: 'Our testing procedures',
      productsTitle: 'Products',
      productsBody:
        'Every product goes through a structured testing process: we check quality, functionality, and everyday usability under realistic conditions. This brings transparency and helps consumers make informed decisions.',
      trainingTitle: 'Training positions',
      trainingBody:
        'We also evaluate training companies with a clear, defined process. We assess training concepts, practical relevance, and mentoring to give young people reliable guidance for their future.',
      more: 'LEARN MORE',
    }
    : {
      title: 'Unsere Prüfverfahren',
      productsTitle: 'Produkte',
      productsBody:
        'Jedes Produkt durchläuft einen strukturierten Testprozess: Wir prüfen Qualität, Funktionalität und Alltagstauglichkeit unter realistischen Bedingungen. So schaffen wir Transparenz und helfen Verbrauchern, fundierte Entscheidungen zu treffen.',
      trainingTitle: 'Ausbildungsplätze',
      trainingBody:
        'Auch Ausbildungsbetriebe unterziehen wir einem klar definierten Prüfverfahren. Wir bewerten Ausbildungs­konzepte, Praxisnähe und Betreuung, um jungen Menschen verlässliche Orientierung für ihre Zukunft zu geben.',
      more: 'MEHR ERFAHREN',
    };
  return (
    <section data-animate="section" className="border-t border-gray-200 py-20 sm:py-24" style={{ backgroundColor: '#f3f4f6' }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-brand-text sm:text-4xl">
            {copy.title}
          </h2>
          <p className="mt-4 text-gray-500 font-normal">
            Transparenz schafft Vertrauen.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Card 1 */}
          <div className="bg-white p-10 shadow-sm border-t-2 border-brand-secondary hover:shadow-md transition-shadow rounded-xl">
            <h3 className="text-xl font-bold text-brand-text mb-4">
              {copy.productsTitle}
            </h3>
            <p className="text-gray-600 leading-relaxed font-normal mb-8">
              {copy.productsBody}
            </p>
            <Link
              href="/produkte/produkt-test#unser-pruefverfahren"
              className="text-xs font-bold text-brand-green uppercase tracking-widest hover:text-brand-text transition-colors"
            >
              Details ansehen
            </Link>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-10 shadow-sm border-t-2 border-brand-accent hover:shadow-md transition-shadow rounded-xl">
            <h3 className="text-xl font-bold text-brand-text mb-4">
              {copy.trainingTitle}
            </h3>
            <p className="text-gray-600 leading-relaxed font-normal mb-8">
              {copy.trainingBody}
            </p>
            <Link
              href="/produkte/ausbildung-check"
              className="text-xs font-bold text-brand-green uppercase tracking-widest hover:text-brand-text transition-colors"
            >
              Details ansehen
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
