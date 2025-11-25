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
    <section data-animate="section" className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
        <h2 className="text-3xl font-semibold text-sky-700 sm:text-4xl">{copy.title}</h2>

        {/* Block 1 */}
        <div
          data-animate="card"
          style={stagger(0)}
          className="mt-8 grid items-start gap-8 md:grid-cols-2"
        >
          <div>
            <h3 className="text-2xl font-semibold">{copy.block1Title}</h3>
            <p className="mt-3 text-gray-700 leading-relaxed">
              {copy.block1Body}
            </p>
            <Link
              href="/produkte/produkt-test"
              className="mt-5 inline-block rounded-md border border-sky-800 px-4 py-2 text-sm font-medium text-sky-900 hover:bg-sky-50"
            >
              {copy.more}
            </Link>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
            {/* replace with your own image */}
            <Image src="/images/expertise-produkt.png" alt="" fill className="object-cover" />
          </div>
        </div>

        {/* Block 2 (reversed) */}
        <div
          data-animate="card"
          style={stagger(1)}
          className="mt-12 grid items-start gap-8 md:grid-cols-2"
        >
          <div className="relative order-2 aspect-[4/3] overflow-hidden rounded-lg md:order-1">
            {/* replace with your own image */}
            <Image src="/images/expertise-training.png" alt="" fill className="object-cover" />
          </div>
          <div className="order-1 md:order-2">
            <h3 className="text-2xl font-semibold">{copy.block2Title}</h3>
            <p className="mt-3 text-gray-700 leading-relaxed">
              {copy.block2Body}
            </p>
            <Link
              href="/produkte/ausbildung-check"
              className="mt-5 inline-block rounded-md border border-sky-800 px-4 py-2 text-sm font-medium text-sky-900 hover:bg-sky-50"
            >
              {copy.more}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
