import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, licensePlansJsonLd, pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Lizenzpläne für das Prüfsiegel: Basic, Premium und Lifetime',
  description:
    'Lizenzpläne für Ihr Prüfsiegel im Überblick: Basic 177 €, Premium 225 € pro Jahr, Lifetime 689 € einmalig (netto). 20 % Rabatt ab 2 und 30 % ab 3 Produkten, Lizenzwahl erst nach bestandener Prüfung.',
  path: '/pakete',
});

export default function PaketeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          licensePlansJsonLd(),
          breadcrumbJsonLd([
            { name: 'Start', path: '/' },
            { name: 'Lizenzpläne', path: '/pakete' },
          ]),
        ]}
      />
      {children}
    </>
  );
}
