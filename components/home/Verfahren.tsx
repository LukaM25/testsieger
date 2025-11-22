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
    <section data-animate="section" className="border-t bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <h2 className="text-3xl font-semibold text-sky-700 sm:text-4xl">{copy.title}</h2>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div
            data-animate="card"
            style={stagger(0)}
            className="rounded-xl bg-gray-50 p-6"
          >
            <h3 className="text-lg font-semibold">{copy.productsTitle}</h3>
            <p className="mt-2 text-gray-700 leading-relaxed">
              {copy.productsBody}
            </p>
            <Link
              href="/produkte/produkt-test"
              className="mt-4 inline-block rounded-md border border-sky-800 px-4 py-2 text-sm font-medium text-sky-900 hover:bg-sky-50"
            >
              {copy.more}
            </Link>
          </div>

          <div
            data-animate="card"
            style={stagger(1)}
            className="rounded-xl bg-gray-50 p-6"
          >
            <h3 className="text-lg font-semibold">{copy.trainingTitle}</h3>
            <p className="mt-2 text-gray-700 leading-relaxed">
              {copy.trainingBody}
            </p>
            <Link
              href="/produkte/ausbildung-check"
              className="mt-4 inline-block rounded-md border border-sky-800 px-4 py-2 text-sm font-medium text-sky-900 hover:bg-sky-50"
            >
              {copy.more}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
