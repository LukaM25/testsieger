"use client";
import Link from 'next/link';
import { useLocale } from '@/components/LocaleProvider';

export default function Footer() {
  const { locale } = useLocale();
  const copy = locale === 'en'
    ? {
      title: 'German Seal Institute',
      tagline: 'The modern standard for B2B verification and compliance.',
      products: 'Leistungen',
      company: 'Company',
      productTest: 'Product Tests',
      trainingCheck: 'Training Check',
      playgroundSafety: 'Playground Safety',
      about: 'About Us',
      contact: 'Contact',
      imprint: 'Imprint',
      rights: 'All rights reserved',
    }
    : {
      title: 'Deutsches Prüf­siegel Institut',
      tagline: 'Der moderne Standard für B2B-Verifizierung und Compliance.',
      products: 'Leistungen',
      company: 'Unternehmen',
      productTest: 'Produkt Tests',
      trainingCheck: 'Ausbildungs Check',
      playgroundSafety: 'Spielplatz Prüfungen DIN EN',
      about: 'Über uns',
      contact: 'Kontakt',
      imprint: 'Impressum',
      rights: 'Alle Rechte vorbehalten',
    };

  return (
    <footer
      className="text-white py-16 border-t border-white/5"
      style={{ backgroundColor: '#0B2545' }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <span className="text-xl font-bold tracking-wide block mb-6">
              Testsieger<span className="text-brand-green font-normal">Check</span>
            </span>
            <p className="text-gray-400 font-light max-w-xs leading-relaxed text-sm">
              {copy.tagline}
            </p>
          </div>
          <div>
            <h4 className="text-brand-green text-xs uppercase tracking-widest mb-6 font-bold">
              {copy.products}
            </h4>
            <ul className="space-y-3 font-light text-sm text-gray-400">
              <li>
                <Link href="/produkte/produkt-test" className="hover:text-white transition-colors">
                  {copy.productTest}
                </Link>
              </li>
              <li>
                <Link href="/produkte/ausbildung-check" className="hover:text-white transition-colors">
                  {copy.trainingCheck}
                </Link>
              </li>
              <li>
                <Link href="/produkte/spielplatz_sicherheit" className="hover:text-white transition-colors">
                  {copy.playgroundSafety}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-brand-green text-xs uppercase tracking-widest mb-6 font-bold">
              {copy.company}
            </h4>
            <ul className="space-y-3 font-light text-sm text-gray-400">
              <li>
                <Link href="/ueber-uns" className="hover:text-white transition-colors">
                  {copy.about}
                </Link>
              </li>
              <li>
                <Link href="/kontakt" className="hover:text-white transition-colors">
                  {copy.contact}
                </Link>
              </li>
              <li>
                <Link href="/impressum" className="hover:text-white transition-colors">
                  {copy.imprint}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-white/5 text-xs text-gray-500 text-center uppercase tracking-widest">
          &copy; {new Date().getFullYear()} TestsiegerCheck. {copy.rights}.
        </div>
      </div>
    </footer>
  );
}
