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
      title: 'DPI Deutsches Prüfsiegel Institut',
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
              DPI<span className="text-brand-green font-normal"> Deutsches Prüfsiegel Institut</span>
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
                <Link href="/produkte/spielplatz-sicherheit" className="hover:text-white transition-colors">
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
        <div className="mt-10 border-t border-white/5 pt-6">
          <div className="w-full px-2 text-xs leading-5 text-gray-400">
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-300">{copy.imprint}</h4>
            <p className="mb-2">Angaben gemäß § 5 DDG</p>
            <div className="grid items-start gap-3 md:grid-cols-2 md:gap-4">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Firma</p>
                <p className="mt-1 text-gray-300">DPI - Deutsches Prüfsiegel Institut GmbH, Kirchseestraße 2, 83666 Waakirchen</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-gray-500">Vertretung</p>
                <p className="mt-1 text-gray-300">Ferdinand Johann Lang, Sebastian Valentin Lang</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Kontakt</p>
                <p className="mt-1 text-gray-300">
                  Telefon <a href="tel:+4915679790129" className="text-gray-300 transition-colors hover:text-white">015679 790129</a>, E-Mail <a href="mailto:info@dpi-siegel.de" className="text-gray-300 transition-colors hover:text-white">info@dpi-siegel.de</a>
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-gray-500">Registereintrag</p>
                <p className="mt-1 text-gray-300">Eintragung im Handelsregister, Registergericht Amtsgericht München, Registernummer HRB 309712</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-white/5 text-xs text-gray-500 text-center uppercase tracking-widest">
          &copy; {new Date().getFullYear()} TestsiegerCheck. {copy.rights}.
        </div>
      </div>
    </footer>
  );
}
