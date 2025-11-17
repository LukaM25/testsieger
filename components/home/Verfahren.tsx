import Link from 'next/link';
import { stagger } from '@/lib/animation';

export default function Verfahren() {
  return (
    <section data-animate="section" className="border-t bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <h2 className="text-3xl font-semibold text-sky-700 sm:text-4xl">Unsere Prüfverfahren</h2>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div
            data-animate="card"
            style={stagger(0)}
            className="rounded-xl bg-gray-50 p-6"
          >
            <h3 className="text-lg font-semibold">Produkte</h3>
            <p className="mt-2 text-gray-700 leading-relaxed">
              Jedes Produkt durchläuft einen strukturierten Testprozess: Wir prüfen Qualität,
              Funktionalität und Alltagstauglichkeit unter realistischen Bedingungen. So schaffen
              wir Transparenz und helfen Verbrauchern, fundierte Entscheidungen zu treffen.
            </p>
            <Link
              href="/produkte/produkt-test"
              className="mt-4 inline-block rounded-md border border-sky-800 px-4 py-2 text-sm font-medium text-sky-900 hover:bg-sky-50"
            >
              MEHR ERFAHREN
            </Link>
          </div>

          <div
            data-animate="card"
            style={stagger(1)}
            className="rounded-xl bg-gray-50 p-6"
          >
            <h3 className="text-lg font-semibold">Ausbildungsplätze</h3>
            <p className="mt-2 text-gray-700 leading-relaxed">
              Auch Ausbildungsbetriebe unterziehen wir einem klar definierten Prüfverfahren.
              Wir bewerten Ausbildungs­konzepte, Praxisnähe und Betreuung, um jungen Menschen
              verlässliche Orientierung für ihre Zukunft zu geben.
            </p>
            <Link
              href="/produkte/ausbildung-check"
              className="mt-4 inline-block rounded-md border border-sky-800 px-4 py-2 text-sm font-medium text-sky-900 hover:bg-sky-50"
            >
              MEHR ERFAHREN
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
