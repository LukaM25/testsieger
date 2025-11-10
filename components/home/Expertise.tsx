import Image from 'next/image';
import Link from 'next/link';

export default function Expertise() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
        <h2 className="text-3xl font-semibold text-sky-700 sm:text-4xl">Unsere Expertise</h2>

        {/* Block 1 */}
        <div className="mt-8 grid items-start gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-2xl font-semibold">Produkt Tests für Verbraucher</h3>
            <p className="mt-3 text-gray-700 leading-relaxed">
              Wir prüfen nicht nur – wir vergleichen, hinterfragen und liefern klare Ergebnisse,
              auf die Verbraucher vertrauen können. Wir machen transparent, was andere verschweigen:
              Qualität, Sicherheit und Alltagstauglichkeit.
            </p>
            <Link
              href="/produkte/produkttest"
              className="mt-5 inline-block rounded-md border border-sky-800 px-4 py-2 text-sm font-medium text-sky-900 hover:bg-sky-50"
            >
              MEHR ERFAHREN
            </Link>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
            {/* replace with your own image */}
            <Image src="/images/expertise-produkt.png" alt="" fill className="object-cover" />
          </div>
        </div>

        {/* Block 2 (reversed) */}
        <div className="mt-12 grid items-start gap-8 md:grid-cols-2">
          <div className="relative order-2 aspect-[4/3] overflow-hidden rounded-lg md:order-1">
            {/* replace with your own image */}
            <Image src="/images/expertise-training.png" alt="" fill className="object-cover" />
          </div>
          <div className="order-1 md:order-2">
            <h3 className="text-2xl font-semibold">Betriebsbewertung für Ausbildung</h3>
            <p className="mt-3 text-gray-700 leading-relaxed">
              Wir bewerten Ausbildungsplätze transparent und strukturiert. Mit unserem Siegel
              zählen Betriebe zu den besten Ausbildungsstellen – für kluge Entscheidungen von Azubis.
            </p>
            <Link
              href="/produkte/ausbildung-check"
              className="mt-5 inline-block rounded-md border border-sky-800 px-4 py-2 text-sm font-medium text-sky-900 hover:bg-sky-50"
            >
              MEHR ERFAHREN
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
