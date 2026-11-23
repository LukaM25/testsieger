import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, howToJsonLd } from '@/lib/seo';

export default function PruefverfahrenLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          howToJsonLd(),
          breadcrumbJsonLd([
            { name: 'Start', path: '/' },
            { name: 'Prüfverfahren', path: '/pruefverfahren' },
          ]),
        ]}
      />
      {children}
    </>
  );
}
