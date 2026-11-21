"use client";
import Link from 'next/link';
import { ArrowRight, BadgeCheck, HardHat, PackageSearch } from 'lucide-react';
import { stagger } from '@/lib/animation';
import { useLocale } from '@/components/LocaleProvider';

export default function Expertise() {
  const { locale } = useLocale();
  const en = locale === 'en';
  const copy = en
    ? {
      title: 'Our Expertise',
      label1: 'For companies',
      title1: 'Product tests & seal',
      annotation1: 'Amazon, OTTO, eBay or other platforms',
      body1:
        'We don’t just test – we compare, question, and deliver clear results procurement and product teams can act on. We make quality, safety, and everyday usability transparent.',
      extra1:
        'This lets retailers and manufacturers show their customers that a product was independently tested: documented in a traceable way, with a test report and a seal for the product page.',
      points1: ['Independent testing against fixed criteria', 'Test report and test seal', 'Personal support'],
      cta1: 'Learn more',
      label2: 'For safety',
      title2: 'Occupational Safety',
      body2:
        'Every company with employees has to meet a legal minimum of occupational safety: risk assessment, instruction, documentation and support from an occupational safety specialist (SiFa) under the Occupational Safety Act and DGUV Regulation 2. We help companies cover this legal framework in a practical, verifiable way.',
      extra2:
        'The area is being built by Ferdinand Lang, who is completing his training as an occupational safety specialist (SiFa).',
      points2: ['Risk assessment under the Occupational Health and Safety Act', 'Instruction and documentation', 'Support per Occupational Safety Act and DGUV Regulation 2', 'Practical, from the trades'],
      cta2: 'Request occupational safety',
    }
    : {
      title: 'Unsere Expertise',
      label1: 'Für Unternehmen',
      title1: 'Produkttest & Prüfsiegel',
      annotation1: 'Amazon, OTTO, eBay oder andere Plattformen',
      body1:
        'Wir prüfen nicht nur – wir vergleichen, hinterfragen und liefern klare Ergebnisse, auf die Einkauf und Produktteams bauen können. Wir machen Qualität, Sicherheit und Alltagstauglichkeit transparent.',
      extra1:
        'So zeigen Händler und Hersteller ihren Kunden, dass ein Produkt unabhängig geprüft wurde: nachvollziehbar dokumentiert, mit Prüfbericht und Siegel für die Produktseite.',
      points1: ['Unabhängige Prüfung nach festen Kriterien', 'Prüfbericht und Prüfsiegel', 'Persönliche Betreuung'],
      cta1: 'Mehr erfahren',
      label2: 'Für Sicherheit',
      title2: 'Arbeitssicherheit',
      body2:
        'Jeder Betrieb mit Beschäftigten muss ein gesetzliches Mindestmaß an Arbeitssicherheit erfüllen: Gefährdungsbeurteilung, Unterweisungen, Dokumentation und die Betreuung durch eine Fachkraft für Arbeitssicherheit (SiFa) nach Arbeitssicherheitsgesetz und DGUV Vorschrift 2. Wir helfen Unternehmen, diesen rechtlichen Rahmen praxisnah und nachweisbar abzudecken.',
      extra2:
        'Aufgebaut wird der Bereich von Ferdinand Lang, der die Ausbildung zur Fachkraft für Arbeitssicherheit (SiFa) absolviert.',
      points2: ['Gefährdungsbeurteilung nach Arbeitsschutzgesetz', 'Unterweisungen und Dokumentation', 'Betreuung nach ASiG und DGUV Vorschrift 2', 'Praxisnah aus dem Handwerk'],
      cta2: 'Arbeitssicherheit anfragen',
    };

  return (
    <section data-animate="section" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 flex items-end justify-between">
          <h2 className="section-title">{copy.title}</h2>
          <div className="mb-2 hidden h-px w-1/3 bg-gradient-to-r from-slate-200 to-transparent sm:block"></div>
        </div>

        <div className="as-solo grid gap-6 lg:grid-cols-2">
          {/* Karte 1: Produkttest */}
          <article
            data-animate="card"
            style={stagger(0)}
            className="flex flex-col rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_20px_60px_-40px_rgba(43,64,102,0.35)] transition duration-500 hover:-translate-y-1"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 text-sky-700 ring-1 ring-sky-100">
              <PackageSearch className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">{copy.label1}</span>
            <h3 className="mt-1 text-2xl font-semibold text-[#2B4066]">{copy.title1}</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">{copy.annotation1}</p>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-600">{copy.body1}</p>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{copy.extra1}</p>
            <ul className="mt-5 space-y-2.5">
              {copy.points1.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-sm text-slate-700">
                  <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-7">
              <Link
                href="/produkte/produkt-test"
                className="group inline-flex items-center gap-2 rounded-full bg-[#2B4066] px-6 py-3 text-sm font-semibold !text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#1e3050]"
              >
                {copy.cta1}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </article>

          {/* Karte 2: Arbeitssicherheit */}
          <article
            data-animate="card"
            style={stagger(1)}
            className="as-only flex flex-col rounded-3xl border border-blue-900/40 bg-gradient-to-b from-[#16294d] to-[#0b1730] p-7 text-white shadow-[0_30px_70px_-35px_rgba(11,23,48,0.8)] transition duration-500 hover:-translate-y-1"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sky-200 ring-1 ring-white/10">
              <HardHat className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-200">{copy.label2}</span>
            <h3 className="mt-1 text-2xl font-semibold text-white">{copy.title2}</h3>
            <p className="mt-4 text-[15px] leading-relaxed text-white/80">{copy.body2}</p>
            <p className="mt-3 text-[15px] leading-relaxed text-white/80">{copy.extra2}</p>
            <ul className="mt-5 space-y-2.5">
              {copy.points2.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-sm text-white/90">
                  <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-7">
              <Link
                href="/kontakt"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold !text-[#16294d] transition duration-300 hover:-translate-y-0.5 hover:bg-sky-50"
              >
                {copy.cta2}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
