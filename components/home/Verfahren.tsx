"use client";
import Link from 'next/link';
import { PackageSearch, ShieldCheck } from 'lucide-react';
import { stagger } from '@/lib/animation';
import { useLocale } from '@/components/LocaleProvider';

export default function Verfahren() {
  const { locale } = useLocale();
  const copy = locale === 'en'
    ? {
      title: 'Our testing procedures',
      subtitle: 'Transparency creates trust.',
      standard: 'According to the DPI standard.',
      productsTitle: 'Products',
      productsBody:
        'Every product goes through a structured testing process: we check quality, functionality, and everyday usability under realistic conditions. This brings transparency and helps consumers make informed decisions.',
      safetyTitle: 'Occupational Safety',
      safetyBody:
        'As an occupational safety specialist, we make risks in the workplace visible and document occupational safety DGUV-compliant, clearly and in a practical way, so companies can improve safety and legal certainty.',
      more: 'Learn more',
    }
    : {
      title: 'Unsere Prüfverfahren',
      subtitle: 'Transparenz schafft Vertrauen.',
      standard: 'Nach DPI Standard.',
      productsTitle: 'Produkte',
      productsBody:
        'Jedes Produkt durchläuft einen strukturierten Testprozess: Wir prüfen Qualität, Funktionalität und Alltagstauglichkeit unter realistischen Bedingungen. So schaffen wir Transparenz und helfen Verbrauchern, fundierte Entscheidungen zu treffen.',
      safetyTitle: 'Arbeitssicherheit',
      safetyBody:
        'Als Fachkraft für Arbeitssicherheit machen wir Risiken am Arbeitsplatz sichtbar und dokumentieren Arbeitssicherheit DGUV-konform, klar und praxisnah, damit Unternehmen Sicherheit und Rechtssicherheit erhöhen.',
      more: 'Details ansehen',
    };

  const cards = [
    {
      Icon: PackageSearch,
      title: copy.productsTitle,
      body: copy.productsBody,
      href: '/produkte/produkt-test#unser-pruefverfahren',
    },
    {
      Icon: ShieldCheck,
      title: copy.safetyTitle,
      body: copy.safetyBody,
      href: '/kontakt',
    },
  ];

  return (
    <section data-animate="section" className="bg-gradient-to-b from-slate-50 to-slate-100/70 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-14 text-center">
          <h2 className="section-title">{copy.title}</h2>
          <div className="mx-auto mt-5 h-0.5 w-14 rounded-full bg-gradient-to-r from-sky-300 to-sky-600"></div>
          <p className="mt-5 text-slate-500">
            {copy.subtitle} <span className="text-slate-400">{copy.standard}</span>
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {cards.map(({ Icon, title, body, href }, index) => (
            <div key={href} data-animate="card" style={stagger(index)}>
              <Link
                href={href}
                className="group relative block h-full overflow-hidden rounded-3xl border border-slate-100 bg-white p-10 shadow-[0_18px_50px_-35px_rgba(43,64,102,0.35)] transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_32px_70px_-35px_rgba(43,64,102,0.5)]"
              >
                {/* weicher Farbverlauf, der beim Hover einblendet */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-sky-100 to-transparent opacity-60 blur-2xl transition-opacity duration-700 group-hover:opacity-100"
                />

                <span className="relative mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 text-sky-700 ring-1 ring-sky-100 transition duration-500 group-hover:-rotate-3 group-hover:scale-110 group-hover:from-sky-100 group-hover:to-sky-200">
                  <Icon className="h-8 w-8" strokeWidth={1.5} />
                </span>

                <h3 className="card-title relative">{title}</h3>
                <p className="body-text relative mb-8">{body}</p>
                <span className="link-more relative">
                  {copy.more}
                  <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1.5">&rarr;</span>
                </span>

                {/* Akzentlinie, die beim Hover von links einläuft */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-sky-300 via-sky-500 to-sky-700 transition-transform duration-500 group-hover:scale-x-100"
                />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
