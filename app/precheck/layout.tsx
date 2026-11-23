import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Jetzt direkt testen lassen: Produkttest mit Prüfsiegel',
  description:
    'Produkt direkt testen lassen, ohne Anmeldung: Testgebühr 179 € netto pro Produkt, bis zu 30 % Rabatt bei mehreren Produkten. Prüfsiegel und Prüfbericht erst nach bestandener Prüfung.',
  path: '/precheck',
});

export default function PrecheckLayout({ children }: { children: React.ReactNode }) {
  return children;
}
