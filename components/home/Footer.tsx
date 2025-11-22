"use client";
import Link from 'next/link';
import Image from 'next/image';
import { stagger } from '@/lib/animation';
import { useLocale } from '@/components/LocaleProvider';

export default function Footer() {
  const { locale } = useLocale();
  const copy = locale === 'en'
    ? {
        title: 'German Seal Institute',
        intro: 'Independent, privately run testing institute for consumer tests – not a government institution.',
        service: 'Service',
        institute: 'The Institute',
        legal: 'Legal',
        productCert: 'Product certification',
        licenseSearch: 'License search',
        contact: 'Contact',
        portal: 'Customer portal',
        precheck: 'Free pre-check',
        productTest: 'Have product tested',
        results: 'Test results',
        procedure: 'Testing procedure',
        imprint: 'Imprint',
        privacy: 'Privacy',
        terms: 'Terms & Conditions',
      }
    : {
        title: 'Deutsches Prüf­siegel Institut',
        intro: 'Unabhängiges, privatwirtschaftliches Prüfinstitut für Verbrauchertests – keine staatliche Institution.',
        service: 'Service',
        institute: 'Das Institut',
        legal: 'Rechtliches',
        productCert: 'Produktzertifizierung',
        licenseSearch: 'Lizenzsuche',
        contact: 'Kontakt',
        portal: 'Kundenportal',
        precheck: 'Kostenloser Pre-Check',
        productTest: 'Produkt testen lassen',
        results: 'Testergebnisse',
        procedure: 'Prüfverfahren',
        imprint: 'Impressum',
        privacy: 'Datenschutz',
        terms: 'AGB',
      };
  return (
    <footer className="relative mt-12 border-t border-gray-200 bg-white overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/footer-band.jpg"
          alt="Dekoratives Band"
          fill
          className="object-cover opacity-75"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-white/70" />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div
            data-animate="footer-column"
            style={stagger(0)}
            className="md:col-span-1"
          >
            <div className="text-xl font-semibold">{copy.title}</div>
            <p className="mt-3 text-sm text-gray-600">
              {copy.intro}
            </p>
            <p className="mt-3 text-xs text-gray-500">© {new Date().getFullYear()} Prüfsiegel Zentrum UG.</p>
          </div>

          <div
            data-animate="footer-column"
            style={stagger(1)}
          >
            <div className="text-sm font-semibold">{copy.service}</div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li><Link href="/produkte" className="hover:underline">{copy.productCert}</Link></li>
              <li><Link href="/lizenzen" className="hover:underline">{copy.licenseSearch}</Link></li>
              <li><Link href="/kontakt" className="hover:underline">{copy.contact}</Link></li>
              <li><Link href="/kundenportal" className="hover:underline">{copy.portal}</Link></li>
            </ul>
          </div>

          <div
            data-animate="footer-column"
            style={stagger(2)}
          >
            <div className="text-sm font-semibold">{copy.institute}</div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li><Link href="/precheck" className="hover:underline">{copy.precheck}</Link></li>
              <li><Link href="/produkte" className="hover:underline">{copy.productTest}</Link></li>
              <li><Link href="/testergebnisse" className="hover:underline">{copy.results}</Link></li>
              <li><Link href="/verfahren" className="hover:underline">{copy.procedure}</Link></li>
            </ul>
          </div>

          <div
            data-animate="footer-column"
            style={stagger(3)}
          >
            <div className="text-sm font-semibold">{copy.legal}</div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li><Link href="/impressum" className="hover:underline">{copy.imprint}</Link></li>
              <li><Link href="/datenschutz" className="hover:underline">{copy.privacy}</Link></li>
              <li><Link href="/agb" className="hover:underline">{copy.terms}</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
